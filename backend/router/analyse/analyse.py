# ── Endpoints ──────────────────────────────────────────────────────────────────
import asyncio
from datetime import datetime, timezone
from typing import Any
import logging
from llm_queue.llm_queue import llm_queue
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from bson import json_util
import json

from helpers.helper import (
    _build_raw_log,
    _final_confidence,
    _save_alert,
    _severity,
    _save_traffic,
    _save_traffic_stats,
)
from ml import detector
from typing import Literal
from schemas.schemas import AlertStatusUpdate, AnalysisResult, LogEvent
from ml import model as llm_module
from config.config import settings
from database import traffic as traffic_repo, alerts as alert_repo
from router.websockets_router import manager, _broadcast_dashboard_update
from helpers.security_helper import _prepare_for_llm, _should_force_llm

log = logging.getLogger(__name__)

analyse_router = APIRouter()

# ── Constants ──────────────────────────────────────────────────────────────────

ALLOWED_IPS = {"127.0.0.1", "::1"}


# ── Main endpoint ──────────────────────────────────────────────────────────────


@analyse_router.post(
    "/analyze", response_model=AnalysisResult, summary="Analyze a network log event"
)
async def analyze(event: LogEvent) -> AnalysisResult:
    if event.src_ip not in ALLOWED_IPS:
        raise HTTPException(status_code=403, detail="Forbidden: IP not allowed")
    raw = event.model_dump()

    ml_result = detector.predict(raw)
    if "error" in ml_result:
        raise HTTPException(status_code=503, detail=ml_result["error"])

    is_anomaly: bool = ml_result["is_anomaly"]
    ml_label: str = ml_result["label"]
    ml_conf: float = ml_result["confidence"]
    ml_model: str = ml_result["model_name"]
    attack_type: str | None = ml_result.get("attack_type")
    risk_signals: list[dict[str, Any]] = ml_result.get("risk_signals", [])
    top_features: list[dict[str, Any]] = ml_result.get("top_features", [])

    force_llm = _should_force_llm(event, ml_conf)

    if is_anomaly or force_llm:
        log_text = _prepare_for_llm(
            raw_log=event.raw_log,
            build_fallback=_build_raw_log(event),
        )

        async def _run_llm():
            return await asyncio.to_thread(
                llm_module.analyze_with_llm,
                log_text,
                {
                    "ml_label": ml_label,
                    "ml_confidence": ml_conf,
                    "ml_model": ml_model,
                    "attack_type": attack_type,
                    "risk_signals": risk_signals,
                    "top_features": top_features,
                    "force_review": force_llm and not is_anomaly,
                },
            )

        llm_result = await llm_queue.submit(_run_llm())

        if (
            force_llm
            and not is_anomaly
            and llm_result.get("classification") in {"Suspicious", "Malicious"}
        ):
            log.info(
                "LLM escalated ML 'normal' verdict to '%s' for %s→%s",
                llm_result["classification"],
                event.src_ip,
                event.dst_ip,
            )
            is_anomaly = True
            attack_type = llm_result.get("attack_type") or attack_type
            ml_label = attack_type or ml_label

    else:
        llm_result = {
            "classification": "Normal",
            "attack_type": None,
            "severity": "low",
            "llm_confidence": ml_conf,
            "evidence": [],
            "knowledge_matches": [],
            "explanation": "Traffic classified as normal by the ML model. No LLM analysis required.",
            "recommended_action": "No action required.",
            "needs_manual_review": False,
            "llm_available": True,
        }

    classification: str = llm_result["classification"]
    final_conf = _final_confidence(
        ml_conf, llm_result["llm_confidence"], llm_result["llm_available"]
    )
    severity = _severity(is_anomaly, classification, ml_conf)

    result = AnalysisResult(
        timestamp=datetime.now(timezone.utc),
        ml_label=ml_label,
        ml_confidence=ml_conf,
        ml_model=ml_model,
        is_anomaly=is_anomaly,
        attack_type=attack_type,
        risk_signals=risk_signals,
        top_features=top_features,
        classification=classification,
        llm_attack_type=llm_result.get("attack_type"),
        llm_severity=llm_result.get("severity"),
        llm_confidence=llm_result["llm_confidence"],
        evidence=llm_result.get("evidence", []),
        knowledge_matches=llm_result.get("knowledge_matches", []),
        explanation=llm_result["explanation"],
        recommended_action=llm_result["recommended_action"],
        needs_manual_review=llm_result["needs_manual_review"],
        llm_available=llm_result["llm_available"],
        final_confidence=final_conf,
        severity=severity,
        src_ip=event.src_ip,
        dst_ip=event.dst_ip,
        protocol=event.protocol,  #
        service=event.service,
        src_port=event.src_port,
        dst_port=event.dst_port,
    )

    if is_anomaly:
        await _save_alert(result)

    if is_anomaly or result.classification in {"Suspicious", "Malicious"}:
        await _save_traffic(event, result, raw)
    else:
        await _save_traffic_stats(event)

    await _broadcast_dashboard_update(result, event)

    return result


# ── CRUD endpoints ─────────────────────────────────────────────────────────────


@analyse_router.get("/alerts")
async def api_alerts(limit: int = Query(default=50, ge=1, le=200)) -> dict[str, Any]:
    if not alert_repo.is_available():
        return {"alerts": [], "storage_available": False}
    return {"alerts": await alert_repo.list_alerts(limit), "storage_available": True}


@analyse_router.patch("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: str, payload: AlertStatusUpdate
) -> dict[str, Any]:
    if not alert_repo.is_available():
        raise HTTPException(status_code=503, detail="Alert storage unavailable")
    try:
        updated = await alert_repo.update_alert_status(alert_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"id": alert_id, "status": payload.status}


@analyse_router.get("/traffic")
async def api_traffic(limit: int = Query(default=50, ge=1, le=200)) -> dict[str, Any]:
    if not traffic_repo.is_available():
        return {"traffic": [], "storage_available": False}
    return {
        "traffic": await traffic_repo.list_traffic(limit),
        "storage_available": True,
    }


@analyse_router.get("/alerts/{alert_id}", summary="Get alert detail")
async def get_alert(alert_id: str) -> dict[str, Any]:
    """Full detail of a single alert — for Threats Analysis drill-down."""
    if not alert_repo.is_available():
        raise HTTPException(status_code=503, detail="Alert storage unavailable")

    alert = await alert_repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@analyse_router.get("/alerts", summary="List alerts with optional filters")
async def api_alerts_filtered(
    limit: int = Query(default=50, ge=1, le=200),
    severity: Literal["low", "medium", "high"] | None = Query(default=None),
    status: Literal["open", "reviewing", "resolved", "false_positive"] | None = Query(
        default=None
    ),
    attack_type: str | None = Query(default=None),
) -> dict[str, Any]:
    """
    List alerts for Threats Analysis page.
    All filters are optional and combinable:
      ?severity=high
      ?status=open
      ?attack_type=injection
      ?severity=high&status=open&attack_type=injection
    """
    if not alert_repo.is_available():
        return {"alerts": [], "storage_available": False}

    alerts = await alert_repo.list_alerts_filtered(
        limit=limit,
        severity=severity,
        status=status,
        attack_type=attack_type,
    )
    return {"alerts": alerts, "storage_available": True}
