# ── Endpoints ──────────────────────────────────────────────────────────────────
from datetime import datetime, timezone
from typing import Any
import re
import urllib.parse
import logging

from fastapi import APIRouter, HTTPException, Query

from helpers.helper import (
    _build_raw_log,
    _final_confidence,
    _save_alert,
    _severity,
    _save_traffic,
    _save_traffic_stats,
)
from ml import detector
from schemas.schemas import AlertStatusUpdate, AnalysisResult, LogEvent
from ml import model as llm_module
from config.config import settings
from database import traffic as traffic_repo, alerts as alert_repo
from fastapi.responses import JSONResponse
from bson import json_util
import json

log = logging.getLogger(__name__)

analyse_router = APIRouter()

# ── Constants ──────────────────────────────────────────────────────────────────
_MAX_RAW_LOG_LEN = 2048
ALLOWED_IPS = {"127.0.0.1", "::1"}

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


def _should_force_llm(event: LogEvent, ml_conf: float = 0.0) -> bool:
    is_web    = event.service in {"http", "ssl"} or event.dst_port in {80, 443, 8080, 8443}
    has_body  = event.http_request_body_len > 500
    status_ok = event.http_status_code == 200
    low_conf  = ml_conf < 0.80
    return is_web and has_body and status_ok and low_conf


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

    is_anomaly: bool                    = ml_result["is_anomaly"]
    ml_label: str                       = ml_result["label"]
    ml_conf: float                      = ml_result["confidence"]
    ml_model: str                       = ml_result["model_name"]
    attack_type: str | None             = ml_result.get("attack_type")
    risk_signals: list[dict[str, Any]]  = ml_result.get("risk_signals", [])
    top_features: list[dict[str, Any]]  = ml_result.get("top_features", [])

    force_llm = _should_force_llm(event, ml_conf)

    if is_anomaly or force_llm:
        log_text = _prepare_for_llm(
            raw_log=event.raw_log,
            build_fallback=_build_raw_log(event),
        )
        llm_result = llm_module.analyze_with_llm(
            log_text,
            {
                "ml_label":       ml_label,
                "ml_confidence":  ml_conf,
                "ml_model":       ml_model,
                "attack_type":    attack_type,
                "risk_signals":   risk_signals,
                "top_features":   top_features,
                "force_review":   force_llm and not is_anomaly,
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
            is_anomaly  = True
            attack_type = llm_result.get("attack_type") or attack_type
            ml_label    = attack_type or ml_label

    else:
        llm_result = {
            "classification":    "Normal",
            "attack_type":       None,
            "severity":          "low",
            "llm_confidence":    ml_conf,
            "evidence":          [],
            "knowledge_matches": [],
            "explanation":       "Traffic classified as normal by the ML model. No LLM analysis required.",
            "recommended_action": "No action required.",
            "needs_manual_review": False,
            "llm_available":     True,
        }

    classification: str = llm_result["classification"]
    final_conf          = _final_confidence(ml_conf, llm_result["llm_confidence"], llm_result["llm_available"])
    severity            = _severity(is_anomaly, classification, ml_conf)

    result = AnalysisResult(
        timestamp            = datetime.now(timezone.utc),
        ml_label             = ml_label,
        ml_confidence        = ml_conf,
        ml_model             = ml_model,
        is_anomaly           = is_anomaly,
        attack_type          = attack_type,
        risk_signals         = risk_signals,
        top_features         = top_features,
        classification       = classification,
        llm_attack_type      = llm_result.get("attack_type"),
        llm_severity         = llm_result.get("severity"),
        llm_confidence       = llm_result["llm_confidence"],
        evidence             = llm_result.get("evidence", []),
        knowledge_matches    = llm_result.get("knowledge_matches", []),
        explanation          = llm_result["explanation"],
        recommended_action   = llm_result["recommended_action"],
        needs_manual_review  = llm_result["needs_manual_review"],
        llm_available        = llm_result["llm_available"],
        final_confidence     = final_conf,
        severity             = severity,
        src_ip               = event.src_ip,
        dst_ip               = event.dst_ip,
        proto                = event.proto,
        service              = event.service,
    )

    if is_anomaly:
        await _save_alert(result)

    if is_anomaly or result.classification in {"Suspicious", "Malicious"}:
        await _save_traffic(event, result, raw)
    else:
        await _save_traffic_stats(event)

    return result


# ── Stats ──────────────────────────────────────────────────────────────────────

@analyse_router.get("/stats")
async def get_stats() -> dict[str, Any]:
    """Toutes les stats pour le dashboard."""
    return {
        "attacks_by_type":     await alert_repo.count_by_attack_type(),
        "attacks_by_severity": await alert_repo.count_by_severity(),
        "attacks_by_status":   await alert_repo.count_by_status(),
        "alerts_over_time":    await alert_repo.alerts_over_time(hours=24),
        "top_attacker_ips":    await alert_repo.top_source_ips(limit=10),
        "traffic_by_protocol": await traffic_repo.count_by_protocol(),
        "traffic_by_service":  await traffic_repo.count_by_service(),
        "traffic_over_time":   await traffic_repo.traffic_over_time(hours=24),
        "top_talker_ips":      await traffic_repo.top_talkers(limit=10),
    }


@analyse_router.get("/stats/alerts")
async def get_alert_stats() -> dict[str, Any]:
    """Stats alertes uniquement."""
    return {
        "by_type":     await alert_repo.count_by_attack_type(),
        "by_severity": await alert_repo.count_by_severity(),
        "by_status":   await alert_repo.count_by_status(),
        "over_time":   await alert_repo.alerts_over_time(hours=24),
        "top_ips":     await alert_repo.top_source_ips(limit=10),
    }


@analyse_router.get("/stats/traffic")
async def get_traffic_stats() -> dict[str, Any]:
    """Stats trafic normal uniquement."""
    return {
        "by_protocol": await traffic_repo.count_by_protocol(),
        "by_service":  await traffic_repo.count_by_service(),
        "over_time":   await traffic_repo.traffic_over_time(hours=24),
        "top_ips":     await traffic_repo.top_talkers(limit=10),
    }


# ── Health & Status ────────────────────────────────────────────────────────────

@analyse_router.get("/health", summary="Health check")
async def health() -> dict[str, Any]:
    bundle = detector._load_bundle()
    pipe   = llm_module._load_pipeline.cache_info()
    return {
        "status":                    "operational",
        "timestamp":                 datetime.now(timezone.utc).isoformat(),
        "ml_model":                  bundle["model_name"] if bundle else None,
        "ml_model_loaded":           bundle is not None,
        "ml_f1":                     round(bundle["metrics"]["f1"], 4) if bundle else None,
        "llm_provider":              llm_module.LLM_PROVIDER,
        "llm_model":                 llm_module.LLM_MODEL_NAME,
        "llm_enabled":               llm_module.LLM_ENABLED,
        "llm_loaded":                pipe.currsize > 0,
        "alert_storage_enabled":     settings.MONGO_ENABLED,
        "alert_storage_connected":   alert_repo.is_available(),
        "traffic_storage_connected": traffic_repo.is_available(),
        "stats_storage_connected":   traffic_repo.is_stats_available(),  # ✅ nouveau
    }


@analyse_router.get("/status")
async def api_status() -> dict[str, Any]:
    return {
        "status":    "operational",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


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
        "traffic":           await traffic_repo.list_traffic(limit),
        "storage_available": True,
    }
    
@analyse_router.get("/stats/traffic/summary")
async def get_traffic_summary(
    hours: int = Query(default=24, ge=1, le=720)
) -> JSONResponse:
    """Vue globale du trafic — normal vs suspicious vs malicious."""
    
    normal     = await traffic_repo.count_by_label(hours=hours)
    anomalies  = await traffic_repo.count_suspicious_malicious(hours=hours)
    
    total_normal = normal[0]["total_normal"] if normal else 0
    
    data = {
        "period_hours":  hours,
        "normal":        total_normal,
        "anomalies":     anomalies,  # [{"_id": "high", "count": 3}, ...]
        "total":         total_normal + sum(a["count"] for a in anomalies),
    }
    return JSONResponse(content=json.loads(json_util.dumps(data)))