"""Helper functions for the IDS-AI pipeline."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from database import alerts as alert_repo, traffic as traffic_repo, traffic_stats_col
from schemas.schemas import AnalysisResult, LogEvent

log = logging.getLogger(__name__)


# ── Severity ───────────────────────────────────────────────────────────────────


def _severity(is_anomaly: bool, classification: str, ml_conf: float) -> str:
    if not is_anomaly:
        return "low"
    if classification == "Malicious" or ml_conf >= 0.85:
        return "high"
    if classification == "Suspicious" or ml_conf >= 0.60:
        return "medium"
    return "low"


# ── Confidence ─────────────────────────────────────────────────────────────────


def _final_confidence(
    ml_confidence: float, llm_confidence: float, llm_available: bool
) -> float:
    if not llm_available:
        return round(ml_confidence, 2)
    return round((0.7 * ml_confidence) + (0.3 * llm_confidence), 2)


# ── Raw log builder ────────────────────────────────────────────────────────────


def _build_raw_log(event: LogEvent) -> str:
    return (
        f"src={event.src_ip}:{event.src_port} dst={event.dst_ip}:{event.dst_port} "
        f"protocol={event.protocol} service={event.service} conn_state={event.conn_state} "
        f"duration={event.duration}s src_bytes={event.src_bytes} dst_bytes={event.dst_bytes} "
        f"missed={event.missed_bytes} src_pkts={event.src_pkts} dst_pkts={event.dst_pkts} "
        f"http_status={event.http_status_code}"
    )


# ── LLM force check ────────────────────────────────────────────────────────────


def _should_force_llm(event: LogEvent) -> bool:
    is_web = event.service in {"http", "ssl"} or event.dst_port in {80, 443, 8080, 8443}
    has_body = event.http_request_body_len > 0 or event.src_bytes > 100
    status_ok = event.http_status_code == 200
    return is_web and has_body and status_ok


# ── Persistence ────────────────────────────────────────────────────────────────


async def _save_alert(result: AnalysisResult) -> None:
    await alert_repo.create_alert(
        {
            "type": result.attack_type or result.ml_label,
            "message": result.explanation,
            "source_ip": result.src_ip,
            "destination_ip": result.dst_ip,
            "severity": result.severity,
            "protocol": result.protocol,
            "status": "open",
            "classification": result.classification,
            "llm_attack_type": result.llm_attack_type,
            "llm_severity": result.llm_severity,
            "ml_label": result.ml_label,
            "ml_confidence": result.ml_confidence,
            "llm_confidence": result.llm_confidence,
            "final_confidence": result.final_confidence,
            "risk_signals": result.risk_signals,
            "top_features": result.top_features,
            "evidence": result.evidence,
            "knowledge_matches": result.knowledge_matches,
            "recommended_action": result.recommended_action,
            "needs_manual_review": result.needs_manual_review,
            "source_port": result.src_port,
            "destination_port": result.dst_port,
        }
    )


async def _save_traffic(
    event: LogEvent, result: AnalysisResult, raw_event: dict[str, Any]
) -> None:
    await traffic_repo.create_traffic_record(
        {
            "source_ip": event.src_ip,
            "destination_ip": event.dst_ip,
            "protocol": event.protocol,
            "service": event.service,
            "packet_size": event.src_bytes + event.dst_bytes,
            "duration": event.duration,
            "label": result.ml_label,
            "is_anomaly": result.is_anomaly,
            "ml_confidence": result.ml_confidence,
            "severity": result.severity,
            "risk_signals": result.risk_signals,
            "top_features": result.top_features,
            "knowledge_matches": result.knowledge_matches,
            "raw_event": raw_event,
            # ── Nouveaux ──────────────────────────────────
            "explanation": result.explanation,
            "evidence": result.evidence,
            "recommended_action": result.recommended_action,
            "classification": result.classification,
            "needs_review": result.needs_manual_review,
            "ml_model": result.ml_model,
            "llm_severity": result.llm_severity,
            "llm_confidence": result.llm_confidence,
            "final_confidence": result.final_confidence,
            "attack_type": result.attack_type or result.llm_attack_type,
            "source_port": result.src_port,
            "destination_port": result.dst_port,
        }
    )


async def _save_traffic_stats(event: LogEvent) -> None:

    if not traffic_repo.is_stats_available():
        return

    now = datetime.now(timezone.utc)
    window = now.replace(second=0, microsecond=0, minute=(now.minute // 5) * 5)

    await traffic_repo.upsert_stats(
        window=window,
        protocol=event.protocol,
        service=event.service,
        src_ip=event.src_ip,
        src_bytes=event.src_bytes,
        dst_bytes=event.dst_bytes,
    )
