# ── Endpoints ──────────────────────────────────────────────────────────────────
from datetime import datetime, timezone
from typing import Any
import asyncio
import os
import re
import urllib.parse
import logging
from uuid import uuid4

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
from schemas.schemas import (
    AlertStatusUpdate,
    AnalysisJobCreateResponse,
    AnalysisJobStatus,
    AnalysisResult,
    LogEvent,
)
from ml import model as llm_module
from database import config as db_config
from database import traffic as traffic_repo, alerts as alert_repo

log = logging.getLogger(__name__)

analyse_router = APIRouter()

_ANALYSIS_QUEUE_MAXSIZE = int(os.getenv("ANALYSIS_QUEUE_MAXSIZE", "1000"))
_ANALYSIS_CONCURRENCY = max(1, int(os.getenv("ANALYSIS_CONCURRENCY", "1")))
_ANALYSIS_TIMEOUT_SECONDS = max(1, int(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "180")))
_ANALYSIS_HISTORY_LIMIT = max(10, int(os.getenv("ANALYSIS_HISTORY_LIMIT", "500")))
_analysis_queue: asyncio.Queue[str] = asyncio.Queue(maxsize=_ANALYSIS_QUEUE_MAXSIZE)
_analysis_worker_tasks: list[asyncio.Task[None]] = []
_analysis_jobs: dict[str, AnalysisJobStatus] = {}
_analysis_job_order: list[str] = []
_analysis_current_job_ids: set[str] = set()
_analysis_lock: asyncio.Lock | None = None

_TERMINAL_JOB_STATES = {"completed", "failed", "cancelled"}


def _get_analysis_lock() -> asyncio.Lock:
    global _analysis_lock
    if _analysis_lock is None:
        _analysis_lock = asyncio.Lock()
    return _analysis_lock


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _store_analysis_job(job: AnalysisJobStatus) -> None:
    async with _get_analysis_lock():
        _analysis_jobs[job.id] = job
        _analysis_job_order.append(job.id)
        await _trim_analysis_history_locked()


async def _trim_analysis_history_locked() -> None:
    while len(_analysis_job_order) > _ANALYSIS_HISTORY_LIMIT:
        oldest_id = _analysis_job_order[0]
        oldest = _analysis_jobs.get(oldest_id)
        if oldest and oldest.status not in _TERMINAL_JOB_STATES:
            break
        _analysis_job_order.pop(0)
        _analysis_jobs.pop(oldest_id, None)


def _queue_position(job_id: str) -> int | None:
    queued_ids = [
        queued_id
        for queued_id in list(getattr(_analysis_queue, "_queue", []))
        if _analysis_jobs.get(queued_id)
        and _analysis_jobs[queued_id].status == "waiting"
    ]
    try:
        return queued_ids.index(job_id) + 1
    except ValueError:
        return None


def _job_with_position(job: AnalysisJobStatus) -> AnalysisJobStatus:
    progress = job.progress
    if job.status == "processing" and job.started_at:
        elapsed = (_utcnow() - job.started_at).total_seconds()
        progress = min(95, max(progress, 10 + int((elapsed / _ANALYSIS_TIMEOUT_SECONDS) * 85)))
    return job.model_copy(
        update={
            "progress": progress,
            "queue_position": _queue_position(job.id)
            if job.status == "waiting"
            else None
        }
    )

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
    ml_result = await asyncio.to_thread(detector.predict, raw)

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
        llm_result = await asyncio.to_thread(
            llm_module.analyze_with_llm,
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


async def _analysis_worker(worker_index: int) -> None:
    while True:
        job_id = await _analysis_queue.get()
        try:
            job = _analysis_jobs.get(job_id)
            if job is None or job.status == "cancelled":
                continue

            started_at = _utcnow()
            async with _get_analysis_lock():
                _analysis_current_job_ids.add(job_id)
                job = job.model_copy(
                    update={
                        "status": "processing",
                        "progress": 10,
                        "queue_position": None,
                        "started_at": started_at,
                        "updated_at": started_at,
                    }
                )
                _analysis_jobs[job_id] = job

            try:
                result = await asyncio.wait_for(
                    _run_analysis_pipeline(job.event),
                    timeout=_ANALYSIS_TIMEOUT_SECONDS,
                )
            except asyncio.TimeoutError as exc:
                raise TimeoutError(
                    f"Analysis timed out after {_ANALYSIS_TIMEOUT_SECONDS}s"
                ) from exc

            completed_at = _utcnow()
            async with _get_analysis_lock():
                current = _analysis_jobs.get(job_id)
                if current and current.status != "cancelled":
                    _analysis_jobs[job_id] = current.model_copy(
                        update={
                            "status": "completed",
                            "progress": 100,
                            "completed_at": completed_at,
                            "updated_at": completed_at,
                            "result": result,
                            "error": None,
                        }
                    )
        except Exception as exc:
            log.exception("Analysis job %s failed in worker %s", job_id, worker_index)
            completed_at = _utcnow()
            async with _get_analysis_lock():
                current = _analysis_jobs.get(job_id)
                if current and current.status != "cancelled":
                    status_code = getattr(exc, "status_code", None)
                    detail = getattr(exc, "detail", str(exc))
                    _analysis_jobs[job_id] = current.model_copy(
                        update={
                            "status": "failed",
                            "progress": 100,
                            "completed_at": completed_at,
                            "updated_at": completed_at,
                            "error": f"{status_code}: {detail}"
                            if status_code
                            else str(detail),
                        }
                    )
        finally:
            async with _get_analysis_lock():
                _analysis_current_job_ids.discard(job_id)
                await _trim_analysis_history_locked()
            _analysis_queue.task_done()


async def start_analysis_worker() -> None:
    if any(not task.done() for task in _analysis_worker_tasks):
        return
    _analysis_worker_tasks.clear()
    for index in range(_ANALYSIS_CONCURRENCY):
        _analysis_worker_tasks.append(
            asyncio.create_task(
                _analysis_worker(index + 1), name=f"analysis-queue-worker-{index + 1}"
            )
        )
    log.info(
        "Analysis workers started (workers=%s, max queue size=%s, timeout=%ss)",
        _ANALYSIS_CONCURRENCY,
        _ANALYSIS_QUEUE_MAXSIZE,
        _ANALYSIS_TIMEOUT_SECONDS,
    )


async def stop_analysis_worker() -> None:
    if not _analysis_worker_tasks:
        return
    for task in _analysis_worker_tasks:
        task.cancel()
    await asyncio.gather(*_analysis_worker_tasks, return_exceptions=True)
    _analysis_worker_tasks.clear()
    log.info("Analysis workers stopped")


def analysis_queue_size() -> int:
    return _analysis_queue.qsize()


def analysis_worker_running() -> bool:
    return any(not task.done() for task in _analysis_worker_tasks)


async def _enqueue_analysis_job(event: LogEvent) -> AnalysisJobStatus:
    if _analysis_queue.full():
        raise HTTPException(
            status_code=429,
            detail="Analysis queue is full. Retry later.",
        )

    if not analysis_worker_running():
        await start_analysis_worker()

    now = _utcnow()
    job = AnalysisJobStatus(
        id=uuid4().hex,
        status="waiting",
        progress=0,
        submitted_at=now,
        updated_at=now,
        timeout_seconds=_ANALYSIS_TIMEOUT_SECONDS,
        event=event,
    )
    await _store_analysis_job(job)
    await _analysis_queue.put(job.id)
    return _job_with_position(job)


# ── Main endpoint ──────────────────────────────────────────────────────────────


@analyse_router.post(
    "/analyze", response_model=AnalysisResult, summary="Analyze a network log event"
)
async def analyze(
    event: LogEvent,
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
    job = await _enqueue_analysis_job(event)
    deadline = asyncio.get_running_loop().time() + _ANALYSIS_TIMEOUT_SECONDS + 5
    while asyncio.get_running_loop().time() < deadline:
        current = _analysis_jobs.get(job.id)
        if current and current.status == "completed" and current.result:
            return current.result
        if current and current.status == "failed":
            raise HTTPException(
                status_code=500,
                detail=current.error or "Analysis failed",
            )
        if current and current.status == "cancelled":
            raise HTTPException(status_code=409, detail="Analysis was cancelled")
        await asyncio.sleep(0.25)

    raise HTTPException(status_code=504, detail="Analysis request timed out")


@analyse_router.post(
    "/analysis/jobs",
    response_model=AnalysisJobCreateResponse,
    status_code=202,
    summary="Queue an analysis job",
)
async def create_analysis_job(event: LogEvent) -> AnalysisJobCreateResponse:
    job = await _enqueue_analysis_job(event)
    return AnalysisJobCreateResponse(
        id=job.id,
        status=job.status,
        queue_position=job.queue_position,
        progress=job.progress,
        submitted_at=job.submitted_at,
    )


@analyse_router.get(
    "/analysis/jobs",
    response_model=list[AnalysisJobStatus],
    summary="List queued and recent analysis jobs",
)
async def list_analysis_jobs(
    limit: int = Query(default=100, ge=1, le=500),
) -> list[AnalysisJobStatus]:
    async with _get_analysis_lock():
        job_ids = _analysis_job_order[-limit:]
        jobs = [_analysis_jobs[job_id] for job_id in job_ids if job_id in _analysis_jobs]
    return [_job_with_position(job) for job in jobs]


@analyse_router.get(
    "/analysis/jobs/{job_id}",
    response_model=AnalysisJobStatus,
    summary="Get an analysis job status",
)
async def get_analysis_job(job_id: str) -> AnalysisJobStatus:
    job = _analysis_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return _job_with_position(job)


@analyse_router.delete(
    "/analysis/jobs/{job_id}",
    response_model=AnalysisJobStatus,
    summary="Cancel a waiting analysis job",
)
async def cancel_analysis_job(job_id: str) -> AnalysisJobStatus:
    async with _get_analysis_lock():
        job = _analysis_jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Analysis job not found")
        if job.status == "processing":
            raise HTTPException(
                status_code=409,
                detail="Analysis is already processing and cannot be cancelled safely.",
            )
        if job.status in _TERMINAL_JOB_STATES:
            return _job_with_position(job)
        now = _utcnow()
        job = job.model_copy(
            update={
                "status": "cancelled",
                "progress": 100,
                "completed_at": now,
                "updated_at": now,
                "queue_position": None,
            }
        )
        _analysis_jobs[job_id] = job
    return job


# Alias endpoint to accept clients using the French spelling '/analyse'
@analyse_router.post(
    "/analyse", response_model=AnalysisResult, summary="Alias for /api/analyze"
)
async def analyse_alias(
    event: LogEvent, current_user: dict = Depends(get_current_user)
) -> AnalysisResult:
    return await analyze(event)


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
        "analysis_queue_capacity": _ANALYSIS_QUEUE_MAXSIZE,
        "analysis_concurrency": _ANALYSIS_CONCURRENCY,
        "analysis_timeout_seconds": _ANALYSIS_TIMEOUT_SECONDS,
        "analysis_active_count": len(_analysis_current_job_ids),
        "analysis_worker_running": analysis_worker_running(),
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
