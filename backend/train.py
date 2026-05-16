# type: ignore
"""
IDS-AI — Training pipeline
Trains RandomForest, XGBoost, and IsolationForest on data.csv,
prints a comparison table, and saves the best model (by F1) to disk.
"""

import os
import warnings
import logging

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    ConfusionMatrixDisplay,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

try:
    from imblearn.over_sampling import SMOTE
    _SMOTE_AVAILABLE = True
except ImportError:
    _SMOTE_AVAILABLE = False
    log = logging.getLogger(__name__)
    log.warning("imbalanced-learn not installed — data augmentation disabled. Run: pip install imbalanced-learn")

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), "ml", "data.csv")
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), "ml", "best_model.joblib")
CONFUSION_MATRIX_DIR = os.path.join(os.path.dirname(__file__), "ml", "confusion_matrices")

# ── Feature lists ──────────────────────────────────────────────────────────────

NUMERIC_FEATURES = [
    "src_port", "dst_port", "duration", "src_bytes", "dst_bytes",
    "missed_bytes", "src_pkts", "src_ip_bytes", "dst_pkts", "dst_ip_bytes",
    "dns_qclass", "dns_qtype", "dns_rcode",
    "http_request_body_len", "http_response_body_len", "http_status_code",
    "http_trans_depth",          # pre-converted to int
]

CATEGORICAL_FEATURES = ["proto", "service", "conn_state"]

ENCODED_FEATURES = [f"{c}_enc" for c in CATEGORICAL_FEATURES]
ALL_FEATURES = NUMERIC_FEATURES + ENCODED_FEATURES


# ── Preprocessing ──────────────────────────────────────────────────────────────

def _convert_http_trans_depth(series: pd.Series) -> pd.Series:
    """Convert '-' to 0 and cast to int."""
    return pd.to_numeric(series.replace("-", "0"), errors="coerce").fillna(0).astype(int)


def fit_preprocessor(df: pd.DataFrame) -> dict:
    """Fit and return a preprocessor bundle (encoders + scaler)."""
    label_encoders: dict[str, LabelEncoder] = {}
    for col in CATEGORICAL_FEATURES:
        le = LabelEncoder()
        le.fit(df[col].astype(str))
        label_encoders[col] = le

    X = _build_feature_matrix(df, label_encoders, fit_scaler=None)
    scaler = StandardScaler()
    scaler.fit(X)

    return {"label_encoders": label_encoders, "scaler": scaler, "feature_names": ALL_FEATURES}


def _build_feature_matrix(
    df: pd.DataFrame,
    label_encoders: dict[str, LabelEncoder],
    fit_scaler: StandardScaler | None,
) -> np.ndarray:
    df = df.copy()

    # http_trans_depth: mixed string/int
    df["http_trans_depth"] = _convert_http_trans_depth(df["http_trans_depth"])

    # Fill numeric NaN with 0
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Encode categoricals (unknown categories → -1)
    for col in CATEGORICAL_FEATURES:
        le = label_encoders[col]
        known = set(le.classes_)
        df[f"{col}_enc"] = df[col].astype(str).apply(
            lambda v, k=known, enc=le: enc.transform([v])[0] if v in k else -1
        )

    X = df[ALL_FEATURES].values.astype(np.float32)

    if fit_scaler is not None:
        X = fit_scaler.transform(X)

    return X


def preprocess(df: pd.DataFrame, preprocessor: dict) -> np.ndarray:
    return _build_feature_matrix(
        df,
        preprocessor["label_encoders"],
        preprocessor["scaler"],
    )


# ── Evaluation helpers ─────────────────────────────────────────────────────────

def _evaluate(name: str, y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    return {"model": name, "accuracy": acc, "precision": prec, "recall": rec, "f1": f1}


def _print_table(rows: list[dict]) -> None:
    header = f"{'Model':<22} {'Accuracy':>9} {'Precision':>10} {'Recall':>8} {'F1':>8}"
    sep = "-" * len(header)
    print(f"\n{sep}")
    print(header)
    print(sep)
    for r in rows:
        print(
            f"{r['model']:<22} {r['accuracy']:>9.4f} {r['precision']:>10.4f}"
            f" {r['recall']:>8.4f} {r['f1']:>8.4f}"
        )
    print(sep)


def _save_confusion_matrix(
    model_name: str,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    labels: list[int],
    display_labels: list[str],
) -> str:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    os.makedirs(CONFUSION_MATRIX_DIR, exist_ok=True)
    filename = f"{model_name.lower().replace(' ', '_')}_confusion_matrix.png"
    output_path = os.path.join(CONFUSION_MATRIX_DIR, filename)

    fig_width = max(8, len(display_labels) * 0.9)
    fig_height = max(6, len(display_labels) * 0.75)
    fig, ax = plt.subplots(figsize=(fig_width, fig_height))
    ConfusionMatrixDisplay.from_predictions(
        y_true,
        y_pred,
        labels=labels,
        display_labels=display_labels,
        xticks_rotation=45,
        cmap="Blues",
        ax=ax,
        colorbar=True,
    )
    ax.set_title(f"{model_name} Confusion Matrix")
    fig.tight_layout()
    fig.savefig(output_path, dpi=160, bbox_inches="tight")
    plt.close(fig)
    log.info("Saved %s confusion matrix to %s", model_name, output_path)
    return output_path


# ── Data augmentation ─────────────────────────────────────────────────────────

def _balance_classes(X: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Oversample minority classes with SMOTE so each class has the same count."""
    if not _SMOTE_AVAILABLE:
        log.warning("Skipping data augmentation (imbalanced-learn not available)")
        return X, y

    counts = pd.Series(y).value_counts()
    log.info("Class distribution before augmentation:\n%s", counts.to_string())

    # SMOTE requires at least k_neighbors+1 samples per class; fall back for tiny classes
    min_samples = counts.min()
    k = min(5, min_samples - 1)
    if k < 1:
        log.warning("Some classes have too few samples for SMOTE — skipping augmentation")
        return X, y

    smote = SMOTE(sampling_strategy="not majority", k_neighbors=k, random_state=42)
    X_res, y_res = smote.fit_resample(X, y)

    after = pd.Series(y_res).value_counts()
    log.info("Class distribution after augmentation:\n%s", after.to_string())
    log.info("Dataset size: %d → %d", len(y), len(y_res))
    return X_res, y_res


# ── Main training routine ──────────────────────────────────────────────────────

def train():
    log.info("Loading dataset from %s", DATA_PATH)
    df = pd.read_csv(DATA_PATH)
    log.info("Dataset shape: %s", df.shape)
    log.info("Attack type distribution:\n%s", df["type"].value_counts().to_string())

    # Encode the multi-class target (type: normal, ddos, dos, injection, …)
    type_encoder = LabelEncoder()
    y = type_encoder.fit_transform(df["type"].astype(str))
    type_classes: list[str] = list(type_encoder.classes_)
    log.info("Classes (%d): %s", len(type_classes), type_classes)

    # Binary label for IsolationForest (0=normal, 1=attack)
    y_binary = df["label"].values.astype(int)

    preprocessor = fit_preprocessor(df)
    X = preprocess(df, preprocessor)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    _, _, y_train_bin, y_test_bin = train_test_split(
        X, y_binary, test_size=0.2, random_state=42, stratify=y_binary
    )
    log.info("Train: %d  Test: %d", len(X_train), len(X_test))

    # Balance minority attack types on training data only
    X_train, y_train = _balance_classes(X_train, y_train)

    results: list[dict] = []
    trained_models: dict[str, object] = {}

    # ── Random Forest ──────────────────────────────────────────────────────────
    log.info("Training RandomForestClassifier (multi-class) …")
    rf = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    results.append(_evaluate("RandomForest", y_test, y_pred_rf))
    trained_models["RandomForest"] = rf
    log.info("RandomForest done  F1=%.4f", results[-1]["f1"])
    print("\n[RandomForest] Classification Report:")
    print(classification_report(y_test, y_pred_rf, target_names=type_classes))
    _save_confusion_matrix(
        "RandomForest",
        y_test,
        y_pred_rf,
        labels=list(range(len(type_classes))),
        display_labels=type_classes,
    )

    # ── XGBoost ───────────────────────────────────────────────────────────────
    log.info("Training XGBClassifier (multi-class) …")
    xgb = XGBClassifier(
        n_estimators=100,
        n_jobs=-1,
        random_state=42,
        eval_metric="mlogloss",
        verbosity=0,
        num_class=len(type_classes),
    )
    xgb.fit(X_train, y_train)
    y_pred_xgb = xgb.predict(X_test)
    results.append(_evaluate("XGBoost", y_test, y_pred_xgb))
    trained_models["XGBoost"] = xgb
    log.info("XGBoost done  F1=%.4f", results[-1]["f1"])
    print("\n[XGBoost] Classification Report:")
    print(classification_report(y_test, y_pred_xgb, target_names=type_classes))
    _save_confusion_matrix(
        "XGBoost",
        y_test,
        y_pred_xgb,
        labels=list(range(len(type_classes))),
        display_labels=type_classes,
    )

    # ── Isolation Forest (anomaly detector — binary, no multi-class) ──────────
    log.info("Training IsolationForest (anomaly detection) …")
    contamination = min(float(y_train_bin.sum() / len(y_train_bin)), 0.5)
    iso = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        n_jobs=-1,
        random_state=42,
    )
    iso.fit(X_train)
    raw_pred = iso.predict(X_test)
    y_pred_iso_bin = np.where(raw_pred == -1, 1, 0)
    # Convert binary predictions to type-label indices for the comparison table
    normal_idx = type_classes.index("normal") if "normal" in type_classes else 0
    y_pred_iso = np.where(y_pred_iso_bin == 1,
                          np.full(len(y_pred_iso_bin), -1),   # unknown attack
                          normal_idx)
    results.append(_evaluate("IsolationForest", y_test_bin, y_pred_iso_bin))
    trained_models["IsolationForest"] = iso
    log.info("IsolationForest done  F1=%.4f", results[-1]["f1"])
    print("\n[IsolationForest] Classification Report (binary):")
    print(classification_report(y_test_bin, y_pred_iso_bin, target_names=["normal", "attack"]))
    _save_confusion_matrix(
        "IsolationForest",
        y_test_bin,
        y_pred_iso_bin,
        labels=[0, 1],
        display_labels=["normal", "attack"],
    )

    # ── Comparison table ───────────────────────────────────────────────────────
    _print_table(results)

    # ── Best supervised model by F1 (RF or XGBoost only) ─────────────────────
    supervised = [r for r in results if r["model"] != "IsolationForest"]
    best = max(supervised, key=lambda r: r["f1"])
    best_name = best["model"]
    best_model = trained_models[best_name]
    log.info("Best model: %s  (F1=%.4f)", best_name, best["f1"])

    # ── Save bundle ───────────────────────────────────────────────────────────
    bundle = {
        "model": best_model,
        "model_name": best_name,
        "label_encoders": preprocessor["label_encoders"],
        "scaler": preprocessor["scaler"],
        "feature_names": preprocessor["feature_names"],
        "type_encoder": type_encoder,
        "type_classes": type_classes,
        "metrics": best,
        # Keep IsolationForest for anomaly scoring
        "iso_model": iso,
    }
    joblib.dump(bundle, MODEL_SAVE_PATH)
    log.info("Saved bundle to %s", MODEL_SAVE_PATH)
    return bundle


if __name__ == "__main__":
    train()
