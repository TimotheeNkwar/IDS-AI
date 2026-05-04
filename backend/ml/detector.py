# type: ignore
"""
IDS-AI — ML inference pipeline
Loads the saved model bundle and exposes a single predict() call.
"""

from __future__ import annotations
import re
import logging
import os
from functools import lru_cache
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

log = logging.getLogger(__name__)

MODEL_PATH = os.getenv(
    "IDS_MODEL_PATH", os.path.join(os.path.dirname(__file__), "best_model.joblib")
)

# These must stay in sync with train.py
NUMERIC_FEATURES = [
    "src_port",
    "dst_port",
    "duration",
    "src_bytes",
    "dst_bytes",
    "missed_bytes",
    "src_pkts",
    "src_ip_bytes",
    "dst_pkts",
    "dst_ip_bytes",
    "dns_qclass",
    "dns_qtype",
    "dns_rcode",
    "http_request_body_len",
    "http_response_body_len",
    "http_status_code",
    "http_trans_depth",
]

CATEGORICAL_FEATURES = ["proto", "service", "conn_state"]
ALL_FEATURES = NUMERIC_FEATURES + [f"{c}_enc" for c in CATEGORICAL_FEATURES]

# ── Payload inspection patterns ───────────────────────────────────────────────
# Each entry: (regex_pattern, signal_name, attack_type, severity)
_PAYLOAD_PATTERNS: list[tuple[str, str, str, str]] = [
    (r"<script[\s>]", "xss_script_tag", "injection", "critical"),
    (r"javascript\s*:", "xss_js_protocol", "injection", "high"),
    (r"on\w+\s*=\s*[\"']", "xss_event_handler", "injection", "high"),
    (r"union.{0,20}select", "sqli_union", "injection", "critical"),
    (r"'\s*or\s*['\d]", "sqli_tautology", "injection", "critical"),
    (r"--\s*$|;\s*drop\s+table", "sqli_comment_drop", "injection", "critical"),
    (r"\.\./\.\./|\.\.\\", "path_traversal", "injection", "high"),
    (r"cmd\.exe|/bin/(?:sh|bash|dash)", "command_injection", "injection", "critical"),
    (r"eval\s*\(|exec\s*\(", "code_injection", "injection", "critical"),
    (r"<\?php|<%=", "server_side_injection", "injection", "critical"),
    (r"ldap://|ldaps://", "ldap_injection", "injection", "high"),
    (r"\$\{.*?\}|#\{.*?\}", "template_injection", "injection", "high"),
]

_SIGNAL_TO_ATTACK: dict[str, str] = {
    name: attack for _, name, attack, _ in _PAYLOAD_PATTERNS
}

_SIGNAL_SEVERITY: dict[str, str] = {
    name: severity for _, name, _, severity in _PAYLOAD_PATTERNS
}

# Minimum confidence assigned when a payload pattern overrides the ML result
_PAYLOAD_OVERRIDE_CONFIDENCE = 0.80


@lru_cache(maxsize=1)
def _load_bundle() -> dict | None:
    if not os.path.exists(MODEL_PATH):
        log.warning("Model bundle not found at %s — run train.py first", MODEL_PATH)
        return None
    try:
        bundle = joblib.load(MODEL_PATH)
        log.info(
            "Loaded model bundle: %s  (F1=%.4f)",
            bundle["model_name"],
            bundle["metrics"]["f1"],
        )
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


def _feature_values(raw: dict[str, Any], bundle: dict) -> dict[str, float]:
    """Convert a raw log dict into unscaled numeric/encoded feature values."""
    label_encoders = bundle["label_encoders"]

    values: dict[str, float] = {}

    for col in NUMERIC_FEATURES:
        val = raw.get(col, 0)
        if col == "http_trans_depth":
            values[col] = _convert_http_trans_depth(val)
        else:
            try:
                values[col] = float(val) if val not in (None, "", "-") else 0.0
            except (TypeError, ValueError):
                values[col] = 0.0

    for col in CATEGORICAL_FEATURES:
        le = label_encoders[col]
        v = str(raw.get(col, ""))
        known = set(le.classes_)
        enc = le.transform([v])[0] if v in known else -1
        values[f"{col}_enc"] = float(enc)

    return values


def _build_row(raw: dict[str, Any], bundle: dict) -> np.ndarray:
    """Convert a raw log dict into a scaled feature vector."""
    scaler = bundle["scaler"]
    values = _feature_values(raw, bundle)
    row = [values[name] for name in ALL_FEATURES]
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


def _inspect_payload(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Scan the raw_log string for known attack payload patterns.
    Returns a list of risk signal dicts (same schema as _risk_signals).
    """
    log_text: str = raw.get("raw_log") or ""
    if not log_text:
        return []

    found: list[dict[str, Any]] = []
    for pattern, signal_name, _, severity in _PAYLOAD_PATTERNS:
        if re.search(pattern, log_text, re.IGNORECASE):
            found.append(
                {
                    "name": signal_name,
                    "severity": severity,
                    "evidence": f"{signal_name} detected in request payload: {log_text[:120]}",
                }
            )

    return found


def _infer_attack_from_payload_signals(signals: list[dict[str, Any]]) -> str:
    """Map the first matching payload signal to an attack type label."""
    for s in signals:
        attack = _SIGNAL_TO_ATTACK.get(s["name"])
        if attack:
            return attack
    return "unknown_attack"


def _risk_signals(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """Knowledge-base-inspired signals that make the ML result explainable."""
    signals: list[dict[str, Any]] = []

    def number(name: str) -> float:
        try:
            return float(raw.get(name, 0) or 0)
        except (TypeError, ValueError):
            return 0.0

    dst_port = int(number("dst_port"))
    src_bytes = number("src_bytes")
    dst_bytes = number("dst_bytes")
    duration = number("duration")
    src_pkts = number("src_pkts")
    dst_pkts = number("dst_pkts")
    http_status = int(number("http_status_code"))
    request_body = number("http_request_body_len")
    response_body = number("http_response_body_len")
    proto = str(raw.get("proto", "")).lower()
    service = str(raw.get("service", "")).lower()
    conn_state = str(raw.get("conn_state", "")).upper()

    suspicious_ports = {4444, 1337, 31337, 5555, 6666, 8888, 9999, 12345, 6667}
    auth_ports = {21, 22, 23, 25, 80, 443, 3306, 3389, 5900}

    if dst_port in suspicious_ports:
        signals.append(
            {
                "name": "backdoor_port",
                "severity": "critical",
                "evidence": f"destination port {dst_port} is commonly used by RAT/backdoor tooling",
            }
        )
    if duration > 30 and 0 < src_bytes + dst_bytes < 2048 and conn_state == "SF":
        signals.append(
            {
                "name": "long_low_volume_session",
                "severity": "high",
                "evidence": "long established connection with low byte volume resembles an idle command channel",
            }
        )
    if src_pkts > 1000 or dst_pkts > 1000:
        signals.append(
            {
                "name": "packet_flood",
                "severity": "critical",
                "evidence": f"high packet volume src_pkts={src_pkts:.0f}, dst_pkts={dst_pkts:.0f}",
            }
        )
    if src_bytes > 0 and dst_bytes == 0 and src_bytes > 100000:
        signals.append(
            {
                "name": "one_way_flood",
                "severity": "high",
                "evidence": "large source byte volume with no destination response",
            }
        )
    if dst_bytes > max(src_bytes * 50, 1) and dst_bytes > 10000:
        signals.append(
            {
                "name": "amplification_ratio",
                "severity": "critical",
                "evidence": "destination bytes exceed source bytes by more than 50x",
            }
        )
    if (
        conn_state in {"S0", "REJ", "RSTO", "RSTR"}
        and duration <= 1
        and src_bytes + dst_bytes < 512
    ):
        signals.append(
            {
                "name": "scan_or_failed_probe",
                "severity": "medium",
                "evidence": f"short {conn_state} connection with minimal bytes",
            }
        )
    if proto == "udp" and duration <= 1 and src_bytes > 10000 and dst_bytes == 0:
        signals.append(
            {
                "name": "udp_flood_pattern",
                "severity": "high",
                "evidence": "short UDP flow with large source volume and no response",
            }
        )
    if service in {"http", "ssl"} or dst_port in {80, 443}:
        if http_status >= 500:
            signals.append(
                {
                    "name": "web_error_after_request",
                    "severity": "medium",
                    "evidence": f"HTTP status {http_status} may indicate malformed/injection input",
                }
            )
        if request_body > 4096:
            signals.append(
                {
                    "name": "large_http_request_body",
                    "severity": "medium",
                    "evidence": f"large HTTP request body ({request_body:.0f} bytes)",
                }
            )
        if response_body > max(request_body * 20, 50000):
            signals.append(
                {
                    "name": "large_http_response",
                    "severity": "high",
                    "evidence": "response body is unusually large compared with request",
                }
            )
    if dst_port in auth_ports and http_status in {401, 403}:
        signals.append(
            {
                "name": "authentication_failure",
                "severity": "medium",
                "evidence": f"auth-related port/status combination dst_port={dst_port}, status={http_status}",
            }
        )

    # ── Payload inspection (raw_log string) ──────────────────────────────────
    payload_signals = _inspect_payload(raw)
    signals.extend(payload_signals)

    return signals[:8]


def _top_features(
    model: Any, raw_log: dict[str, Any], bundle: dict, limit: int = 5
) -> list[dict[str, Any]]:
    importances = getattr(model, "feature_importances_", None)
    if importances is None:
        return []

    values = _feature_values(raw_log, bundle)
    ranked = sorted(
        zip(ALL_FEATURES, importances),
        key=lambda item: float(item[1]),
        reverse=True,
    )[:limit]
    return [
        {
            "name": name,
            "importance": round(float(importance), 4),
            "value": round(float(values.get(name, 0.0)), 4),
        }
        for name, importance in ranked
    ]


def predict(raw_log: dict[str, Any]) -> dict[str, Any]:
    """
    Run the ML pipeline on a single raw log dict.

    Steps:
      1. ML model predicts normal / attack type
      2. Payload inspection scans raw_log string for known attack patterns
      3. If payload signals found but ML says normal → override to anomaly

    Returns:
        {
            "is_anomaly": bool,
            "label": "normal" | <attack_type>,
            "attack_type": str | None,
            "confidence": float,
            "model_name": str,
            "risk_signals": list,
            "top_features": list,
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

    # ── Payload override ──────────────────────────────────────────────────────
    # If the ML model missed it but the raw_log contains a known attack pattern,
    # we force is_anomaly=True so the LLM layer is always invoked for inspection.
    payload_signals = _inspect_payload(raw_log)
    if payload_signals and not is_anomaly:
        log.info(
            "Payload inspection overriding ML 'normal' verdict — signals: %s",
            [s["name"] for s in payload_signals],
        )
        is_anomaly = True
        attack_type = _infer_attack_from_payload_signals(payload_signals)
        label = attack_type
        # Keep ML confidence if it was already high, otherwise floor at threshold
        confidence = max(confidence, _PAYLOAD_OVERRIDE_CONFIDENCE)

    return {
        "is_anomaly": is_anomaly,
        "label": label,
        "attack_type": attack_type,
        "confidence": round(confidence, 4),
        "model_name": model_name,
        "risk_signals": _risk_signals(raw_log),
        "top_features": _top_features(model, raw_log, bundle),
    }
