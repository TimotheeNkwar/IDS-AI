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
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data.csv")
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), "best_model.joblib")

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
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
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


# ── Main training routine ──────────────────────────────────────────────────────

def train():
    log.info("Loading dataset from %s", DATA_PATH)
    df = pd.read_csv(DATA_PATH)
    log.info("Dataset shape: %s", df.shape)

    y = df["label"].values.astype(int)

    # Build preprocessor on full data first, then split
    preprocessor = fit_preprocessor(df)
    X = preprocess(df, preprocessor)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    log.info("Train: %d  Test: %d", len(X_train), len(X_test))

    results: list[dict] = []
    trained_models: dict[str, object] = {}

    # ── Random Forest ──────────────────────────────────────────────────────────
    log.info("Training RandomForestClassifier …")
    rf = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    results.append(_evaluate("RandomForest", y_test, y_pred_rf))
    trained_models["RandomForest"] = rf
    log.info("RandomForest done  F1=%.4f", results[-1]["f1"])
    print("\n[RandomForest] Classification Report:")
    print(classification_report(y_test, y_pred_rf, target_names=["normal", "attack"]))

    # ── XGBoost ───────────────────────────────────────────────────────────────
    log.info("Training XGBClassifier …")
    xgb = XGBClassifier(
        n_estimators=100,
        n_jobs=-1,
        random_state=42,
        eval_metric="logloss",
        verbosity=0,
    )
    xgb.fit(X_train, y_train)
    y_pred_xgb = xgb.predict(X_test)
    results.append(_evaluate("XGBoost", y_test, y_pred_xgb))
    trained_models["XGBoost"] = xgb
    log.info("XGBoost done  F1=%.4f", results[-1]["f1"])
    print("\n[XGBoost] Classification Report:")
    print(classification_report(y_test, y_pred_xgb, target_names=["normal", "attack"]))

    # ── Isolation Forest ──────────────────────────────────────────────────────
    log.info("Training IsolationForest …")
    contamination = float(y_train.sum() / len(y_train))
    # Cap contamination at 0.5 (IsolationForest max allowed value)
    contamination = min(contamination, 0.5)
    iso = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        n_jobs=-1,
        random_state=42,
    )
    iso.fit(X_train)
    # Map: -1 (anomaly) → 1 (attack),  1 (normal) → 0
    raw_pred = iso.predict(X_test)
    y_pred_iso = np.where(raw_pred == -1, 1, 0)
    results.append(_evaluate("IsolationForest", y_test, y_pred_iso))
    trained_models["IsolationForest"] = iso
    log.info("IsolationForest done  F1=%.4f", results[-1]["f1"])
    print("\n[IsolationForest] Classification Report:")
    print(classification_report(y_test, y_pred_iso, target_names=["normal", "attack"]))

    # ── Comparison table ───────────────────────────────────────────────────────
    _print_table(results)

    # ── Best model by F1 ──────────────────────────────────────────────────────
    best = max(results, key=lambda r: r["f1"])
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
        "metrics": best,
    }
    joblib.dump(bundle, MODEL_SAVE_PATH)
    log.info("Saved bundle to %s", MODEL_SAVE_PATH)
    return bundle


if __name__ == "__main__":
    train()
