# type: ignore
"""
IDS-AI — ML inference pipeline
Loads the saved model bundle and exposes a single predict() call.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

log = logging.getLogger(__name__)

MODEL_PATH = os.getenv("IDS_MODEL_PATH", os.path.join(os.path.dirname(__file__), "best_model.joblib"))

# These must stay in sync with train.py
NUMERIC_FEATURES = [
    "src_port", "dst_port", "duration", "src_bytes", "dst_bytes",
    "missed_bytes", "src_pkts", "src_ip_bytes", "dst_pkts", "dst_ip_bytes",
    "dns_qclass", "dns_qtype", "dns_rcode",
    "http_request_body_len", "http_response_body_len", "http_status_code",
    "http_trans_depth",
]

CATEGORICAL_FEATURES = ["proto", "service", "conn_state"]
ALL_FEATURES = NUMERIC_FEATURES + [f"{c}_enc" for c in CATEGORICAL_FEATURES]


@lru_cache(maxsize=1)
def _load_bundle() -> dict | None:
    if not os.path.exists(MODEL_PATH):
        log.warning("Model bundle not found at %s — run train.py first", MODEL_PATH)
        return None
    try:
        bundle = joblib.load(MODEL_PATH)
        log.info("Loaded model bundle: %s  (F1=%.4f)", bundle["model_name"], bundle["metrics"]["f1"])
        return bundle
    except Exception as exc:
        log.error("Failed to load model bundle: %s", exc)
        return None


def _convert_http_trans_depth(value: Any) -> float:
    if value in ("-", None, ""):
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _build_row(raw: dict[str, Any], bundle: dict) -> np.ndarray:
    """Convert a raw log dict into a scaled feature vector."""
    label_encoders = bundle["label_encoders"]
    scaler = bundle["scaler"]

    row: list[float] = []

    # Numeric features
    for col in NUMERIC_FEATURES:
        val = raw.get(col, 0)
        if col == "http_trans_depth":
            row.append(_convert_http_trans_depth(val))
        else:
            try:
                row.append(float(val) if val not in (None, "", "-") else 0.0)
            except (TypeError, ValueError):
                row.append(0.0)

    # Categorical features
    for col in CATEGORICAL_FEATURES:
        le = label_encoders[col]
        v = str(raw.get(col, ""))
        known = set(le.classes_)
        enc = le.transform([v])[0] if v in known else -1
        row.append(float(enc))

    X = np.array(row, dtype=np.float32).reshape(1, -1)
    return scaler.transform(X)


def _isolation_confidence(model: IsolationForest, X: np.ndarray) -> float:
    """Normalise IsolationForest anomaly score to [0, 1]."""
    raw_score = model.decision_function(X)[0]
    # decision_function: positive = normal, negative = anomaly
    # Map to anomaly probability: 0 = very normal, 1 = very anomalous
    # Typical range is roughly [-0.5, 0.5]
    clamped = max(-0.5, min(0.5, raw_score))
    return float(0.5 - clamped)  # invert: more negative → higher anomaly score


def predict(raw_log: dict[str, Any]) -> dict[str, Any]:
    """
    Run the ML pipeline on a single raw log dict.

    Returns:
        {
            "is_anomaly": bool,
            "label": "normal" | <attack_type>,   # e.g. "ddos", "injection", …
            "attack_type": str | None,            # None when normal
            "confidence": float,                  # 0‒1
            "model_name": str,
        }
    """
    bundle = _load_bundle()
    if bundle is None:
        return {
            "is_anomaly": False,
            "label": "unknown",
            "attack_type": None,
            "confidence": 0.0,
            "model_name": "none",
            "error": "Model not loaded — run train.py first",
        }

    X = _build_row(raw_log, bundle)
    model = bundle["model"]
    model_name = bundle["model_name"]
    type_encoder = bundle.get("type_encoder")
    type_classes: list[str] = bundle.get("type_classes", [])

    if isinstance(model, IsolationForest):
        raw_pred = model.predict(X)[0]
        is_anomaly = raw_pred == -1
        confidence = _isolation_confidence(model, X)
        attack_type = "unknown_attack" if is_anomaly else None
        label = attack_type if is_anomaly else "normal"
    else:
        pred_idx = int(model.predict(X)[0])
        proba = model.predict_proba(X)[0]
        confidence = float(proba[pred_idx])

        predicted_type = (
            type_encoder.inverse_transform([pred_idx])[0]
            if type_encoder is not None
            else (type_classes[pred_idx] if type_classes else str(pred_idx))
        )
        is_anomaly = predicted_type != "normal"
        attack_type = predicted_type if is_anomaly else None
        label = predicted_type

    return {
        "is_anomaly": is_anomaly,
        "label": label,
        "attack_type": attack_type,
        "confidence": round(confidence, 4),
        "model_name": model_name,
    }
