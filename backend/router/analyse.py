# ── Endpoints ──────────────────────────────────────────────────────────────────
from datetime import datetime, timezone
from typing import Any
import asyncio
import os
import re
import urllib.parse
import logging

from fastapi import APIRouter, HTTPException, Query, Depends

from users.oauth import get_current_user

from helpers.helper import (
    _build_raw_log,
    _final_confidence,
    _save_alert,
    _severity,
    _save_traffic,
)
from ml import detector
from schemas.schemas import AlertStatusUpdate, AnalysisResult, LogEvent
from ml import model as llm_module
from database import config as db_config
from database import traffic as traffic_repo, alerts as alert_repo

log = logging.getLogger(__name__)

analyse_router = APIRouter()

_ANALYSIS_QUEUE_MAXSIZE = int(os.getenv("ANALYSIS_QUEUE_MAXSIZE", "1000"))
_analysis_queue: asyncio.Queue[tuple[LogEvent, asyncio.Future[AnalysisResult]]] = (
    asyncio.Queue(maxsize=_ANALYSIS_QUEUE_MAXSIZE)
)
_analysis_worker_task: asyncio.Task[None] | None = None

# ── Constants ──────────────────────────────────────────────────────────────────
_MAX_RAW_LOG_LEN = 2048

_PROMPT_INJECTION_PATTERNS: list[str] = [
    r"ignore\s+(previous|above|all)\s+instructions?",
    r"you\s+are\s+now",
    r"act\s+as\s+",
    r"system\s*:",
    r"<\s*/?\s*system\s*>",
    r"forget\s+(everything|all)",
    r"new\s+instructions?\s*:",
    r"disregard\s+(all|previous)",
    r"override\s+(previous|all)",
    r"your\s+new\s+role",
]

# ── Security helpers ───────────────────────────────────────────────────────────


def _sanitize_raw_log(raw_log: str | None) -> str:
    if not raw_log:
        return ""
    text = raw_log[:_MAX_RAW_LOG_LEN]
    text = urllib.parse.unquote(text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text


def _contains_prompt_injection(text: str) -> bool:
    return any(
        re.search(pattern, text, re.IGNORECASE)
        for pattern in _PROMPT_INJECTION_PATTERNS
    )


def _prepare_for_llm(raw_log: str | None, build_fallback: str) -> str:
    sanitized = _sanitize_raw_log(raw_log)
    if not sanitized:
        return build_fallback
    if _contains_prompt_injection(sanitized):
        log.warning(
            "Prompt injection attempt detected in raw_log — redacting before LLM call. "
            "Original (truncated): %.120s",
            sanitized,
        )
        return "[RAW LOG REDACTED — prompt injection attempt detected]"
    return sanitized


def _should_force_llm(event: LogEvent) -> bool:
    """
    Force LLM analysis even when ML says normal, for HTTP/S traffic
    with a non-trivial request that succeeded (status 200).

    Rationale: a hacker can set raw_log="" to bypass _inspect_payload,
    but cannot fake network-level features. The LLM receives a
    reconstructed log from _build_raw_log() and can still flag anomalies.

    Triggers when ALL of:
      - Web traffic (HTTP/HTTPS port or service)
      - Request has a body or non-trivial byte volume
      - Server responded successfully (status 200)
    """
    is_web = event.service in {"http", "ssl"} or event.dst_port in {80, 443, 8080, 8443}
    has_body = event.http_request_body_len > 0 or event.src_bytes > 100
    status_ok = event.http_status_code == 200
    return is_web and has_body and status_ok


async def _run_analysis_pipeline(event: LogEvent) -> AnalysisResult:
    """Run the existing IDS pipeline for a single event."""
    raw = event.model_dump()

    # ── Step 1-3: ML prediction (includes payload inspection override) ─────────
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

    # ── Step 4: LLM analysis ───────────────────────────────────────────────────
    force_llm = _should_force_llm(event)

    if is_anomaly or force_llm:
        log_text = _prepare_for_llm(
            raw_log=event.raw_log,
            build_fallback=_build_raw_log(event),
        )
        llm_result = llm_module.analyze_with_llm(
            log_text,
            {
                "ml_label": ml_label,
                "ml_confidence": ml_conf,
                "ml_model": ml_model,
                "attack_type": attack_type,
                "risk_signals": risk_signals,
                "top_features": top_features,
                # Hint for the LLM: ML said normal but we're double-checking
                "force_review": force_llm and not is_anomaly,
            },
        )

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
        proto=event.proto,
        service=event.service,
    )

    if is_anomaly:
        await _save_alert(result)

    await _save_traffic(event, result, raw)

    return result


async def _analysis_worker() -> None:
    while True:
        event, future = await _analysis_queue.get()
        try:
            result = await _run_analysis_pipeline(event)
            if not future.cancelled():
                future.set_result(result)
        except Exception as exc:
            if not future.cancelled():
                future.set_exception(exc)
        finally:
            _analysis_queue.task_done()


async def start_analysis_worker() -> None:
    global _analysis_worker_task
    if _analysis_worker_task and not _analysis_worker_task.done():
        return
    _analysis_worker_task = asyncio.create_task(
        _analysis_worker(), name="analysis-queue-worker"
    )
    log.info("Analysis worker started (max queue size=%s)", _ANALYSIS_QUEUE_MAXSIZE)


async def stop_analysis_worker() -> None:
    global _analysis_worker_task
    if _analysis_worker_task is None:
        return
    _analysis_worker_task.cancel()
    try:
        await _analysis_worker_task
    except asyncio.CancelledError:
        pass
    _analysis_worker_task = None
    log.info("Analysis worker stopped")


def analysis_queue_size() -> int:
    return _analysis_queue.qsize()


# ── Main endpoint ──────────────────────────────────────────────────────────────


@analyse_router.post(
    "/analyze", response_model=AnalysisResult, summary="Analyze a network log event"
)
async def analyze(
    event: LogEvent, current_user: dict = Depends(get_current_user)  # ← type annoté
) -> AnalysisResult:
    """
    Full IDS pipeline:
    1. Preprocess input features
    2. ML model predicts normal / attack + confidence
       → Payload inspection overrides ML if raw_log contains known patterns
    3. LLM classifies: Normal / Suspicious / Malicious
       → Always called for anomalies
       → Also called for HTTP/S traffic even if ML says normal (raw_log="" bypass defense)
       → raw_log is sanitized and checked for prompt injection before LLM call
    4. Return combined result with severity and explanation
    """
    if _analysis_queue.full():
        raise HTTPException(
            status_code=429,
            detail="Analysis queue is full. Retry later.",
        )

    if _analysis_worker_task is None or _analysis_worker_task.done():
        await start_analysis_worker()

    loop = asyncio.get_running_loop()
    future: asyncio.Future[AnalysisResult] = loop.create_future()
    await _analysis_queue.put((event, future))

    return await future


# Alias endpoint to accept clients using the French spelling '/analyse'
@analyse_router.post(
    "/analyse", response_model=AnalysisResult, summary="Alias for /api/analyze"
)
async def analyse_alias(
    event: LogEvent, current_user: dict = Depends(get_current_user)
) -> AnalysisResult:
    return await analyze(event, current_user)


# ── Legacy endpoints (kept for backward compatibility) ─────────────────────────


@analyse_router.get("/health", summary="Health check")
async def health() -> dict[str, Any]:
    bundle = detector._load_bundle()
    pipe = llm_module._load_pipeline.cache_info()
    return {
        "status": "operational",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ml_model": bundle["model_name"] if bundle else None,
        "ml_model_loaded": bundle is not None,
        "ml_f1": round(bundle["metrics"]["f1"], 4) if bundle else None,
        "llm_provider": llm_module.LLM_PROVIDER,
        "llm_model": llm_module.LLM_MODEL_NAME,
        "llm_enabled": llm_module.LLM_ENABLED,
        "llm_loaded": pipe.currsize > 0,
        "alert_storage_enabled": db_config.MONGO_ENABLED,
        "alert_storage_connected": alert_repo.is_available(),
        "traffic_storage_connected": traffic_repo.is_available(),
        "analysis_queue_size": analysis_queue_size(),
        "analysis_worker_running": _analysis_worker_task is not None
        and not _analysis_worker_task.done(),
    }


@analyse_router.get("/status")
async def api_status() -> dict[str, Any]:
    return {
        "status": "operational",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


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
