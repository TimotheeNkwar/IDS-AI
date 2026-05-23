# ── Endpoints ──────────────────────────────────────────────────────────────────
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any
import logging
from llm_queue.llm_queue import llm_queue
from fastapi import APIRouter, HTTPException, Query
from services.abuseipdb import AbuseIPDB, AbuseResult
import os

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

ALLOWED_IPS = {"127.0.0.1", "::1", "192.168.0.101"}
abuse_checker = AbuseIPDB(api_key=os.getenv("ABUSEIPDB_KEY", ""))

WHITELISTED_RANGES = [
    "20.",  # Microsoft Azure
    "13.",  # Microsoft/AWS
    "40.",  # Microsoft Azure
    "142.250.",  # Google
    "172.217.",  # Google
    "31.13.",  # Meta
    "17.",  # Apple
]


def is_allowed(src_ip: str, dst_ip: str) -> bool:
    return (
        src_ip.startswith("192.168.")
        or src_ip in {"127.0.0.1", "::1"}
        or dst_ip.startswith("192.168.")
        or dst_ip in {"127.0.0.1", "::1"}
    )


def is_whitelisted(ip: str) -> bool:
    return any(ip.startswith(r) for r in WHITELISTED_RANGES)


# ── Main endpoint ──────────────────────────────────────────────────────────────


log = logging.getLogger("ids-ai")

analyse_router = APIRouter()

# ---------------------------------------------------------------------------
# AbuseIPDB client (singleton)
# ---------------------------------------------------------------------------
abuse_checker = AbuseIPDB(api_key=os.getenv("ABUSEIPDB_KEY", ""))

# ---------------------------------------------------------------------------
# IP FILTERING
# ---------------------------------------------------------------------------
WHITELISTED_RANGES = [
    "20.",  # Microsoft Azure
    "13.",  # Microsoft / AWS
    "40.",  # Microsoft Azure
    "52.",  # AWS
    "142.250.",  # Google
    "172.217.",  # Google
    "31.13.",  # Meta / Facebook
    "17.",  # Apple
]

WHITELISTED_PROTOCOLS = {"icmp"}  # trop de faux positifs


def is_allowed(src_ip: str, dst_ip: str) -> bool:
    """Au moins une des deux IPs doit être locale."""

    def is_local(ip: str) -> bool:
        return ip.startswith("192.168.") or ip in {"127.0.0.1", "::1"}

    return is_local(src_ip) or is_local(dst_ip)


def is_whitelisted(ip: str, protocol: str = "") -> bool:
    """IPs ou protocoles connus comme légitimes → skip ML/LLM."""
    if protocol.lower() in WHITELISTED_PROTOCOLS:
        return True
    return any(ip.startswith(r) for r in WHITELISTED_RANGES)


def _whitelisted_result(event: "LogEvent") -> "AnalysisResult":
    return AnalysisResult(
        timestamp=datetime.now(timezone.utc),
        ml_label="Whitelisted Source IP",
        ml_confidence=1.0,
        ml_model="N/A",
        is_anomaly=False,
        attack_type=None,
        risk_signals=[],
        top_features=[],
        classification="Normal",
        llm_attack_type=None,
        llm_severity=None,
        llm_confidence=1.0,
        evidence=[],
        knowledge_matches=[],
        explanation="Source IP is whitelisted. Classified as normal without ML/LLM analysis.",
        recommended_action="No action required.",
        needs_manual_review=False,
        llm_available=False,
        final_confidence=1.0,
        severity="low",
        src_ip=event.src_ip,
        dst_ip=event.dst_ip,
        protocol=event.protocol,
        service=event.service,
        src_port=event.src_port,
        dst_port=event.dst_port,
    )


def _malicious_result(event: "LogEvent", abuse: AbuseResult) -> "AnalysisResult":
    return AnalysisResult(
        timestamp=datetime.now(timezone.utc),
        ml_label="Known Malicious IP",
        ml_confidence=abuse.abuse_score / 100,
        ml_model="AbuseIPDB",
        is_anomaly=True,
        attack_type="Blacklisted IP",
        risk_signals=[abuse.to_dict()],
        top_features=[],
        classification="Malicious",
        llm_attack_type=None,
        llm_severity="high",
        llm_confidence=abuse.abuse_score / 100,
        evidence=[
            f"AbuseIPDB confidence: {abuse.abuse_score}%",
            f"Total reports: {abuse.total_reports}",
            f"ISP: {abuse.isp} ({abuse.country})",
            f"Usage type: {abuse.usage_type}",
        ],
        knowledge_matches=[],
        explanation=(
            f"IP {event.src_ip} is a known malicious address. "
            f"AbuseIPDB score: {abuse.abuse_score}% "
            f"({abuse.total_reports} reports). "
            f"ISP: {abuse.isp} ({abuse.country}). "
            f"Usage: {abuse.usage_type}."
        ),
        recommended_action=f"Block IP {event.src_ip} immediately.",
        needs_manual_review=False,
        llm_available=False,
        final_confidence=abuse.abuse_score / 100,
        severity="high",
        src_ip=event.src_ip,
        dst_ip=event.dst_ip,
        protocol=event.protocol,
        service=event.service,
        src_port=event.src_port,
        dst_port=event.dst_port,
    )


# ── Main endpoint ──────────────────────────────────────────────────────────────
@analyse_router.post(
    "/analyze", response_model=AnalysisResult, summary="Analyze a network log event"
)
async def analyze(event: LogEvent) -> AnalysisResult:

    # 1. IP allowlist check
    if not is_allowed(event.src_ip, event.dst_ip):
        raise HTTPException(status_code=403, detail="Forbidden: IP not allowed")

    # 2. Whitelist check (Microsoft, Google, ICMP, etc.)
    if is_whitelisted(event.src_ip, event.protocol):
        return _whitelisted_result(event)

    # 3. AbuseIPDB enrichissement
    abuse: AbuseResult = await abuse_checker.check(event.src_ip)

    force_llm = False
    # Malicious IPs → direct block, no ML/LLM needed (score > 80% = Malicious, 50-80% = Suspicious but on liste noire, on veut pas rater)
    if abuse.is_malicious:
        force_llm = True
        log.warning(
            "Known malicious IP %s (AbuseIPDB score=%d%%, ISP=%s)",
            event.src_ip,
            abuse.abuse_score,
            abuse.isp,
        )

    # 4. ML pipeline
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

    # AbuseIPDB score > 30% → even though ML says "normal", we want to force LLM review (defense in depth)
    force_llm = force_llm or _should_force_llm(event, ml_conf) or abuse.should_force_llm

    # 5. LLM pipeline
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
                    "abuse_score": abuse.abuse_score,  # ← contexte AbuseIPDB
                    "abuse_isp": abuse.isp,
                    "abuse_country": abuse.country,
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

    # 6. Build result
    classification: str = llm_result["classification"]
    final_conf = _final_confidence(
        ml_conf, llm_result["llm_confidence"], llm_result["llm_available"]
    )
    severity = _severity(is_anomaly, classification, ml_conf)

    # Add signals from AbuseIPDB if score > 0
    if abuse.abuse_score > 0:
        risk_signals = [abuse.to_dict(), *risk_signals]

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
        protocol=event.protocol,
        service=event.service,
        src_port=event.src_port,
        dst_port=event.dst_port,
    )

    # 7. Persist
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
async def api_alerts_filtered(
    limit: int = Query(default=500, ge=1, le=720),
    hours: int = Query(default=24, ge=1, le=720),
    severity: Literal["low", "medium", "high"] | None = Query(default=None),
    status: Literal["open", "reviewing", "resolved", "false_positive"] | None = Query(
        default=None
    ),
    attack_type: str | None = Query(default=None),
) -> dict[str, Any]:
    if not alert_repo.is_available():
        return {"alerts": [], "storage_available": False}

    alerts = await alert_repo.list_alerts_filtered(
        limit=limit,
        hours=hours,  # ← comme traffic
        severity=severity,
        status=status,
        attack_type=attack_type,
    )
    return {"alerts": alerts, "storage_available": True}


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
async def api_traffic(
    limit: int = Query(default=500, ge=1, le=720),
    hours: int = Query(default=24, ge=1, le=720),
) -> dict[str, Any]:
    if not traffic_repo.is_available():
        return {"traffic": [], "storage_available": False}

    return {
        "traffic": await traffic_repo.list_traffic(
            limit=limit, hours=hours
        ),  # ← hours passed?
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


@analyse_router.get("/blacklist")
async def get_blacklist(
    limit: int = Query(default=100, ge=1, le=10000),
    min_score: int = Query(default=90, ge=1, le=100),
) -> dict:
    ips = await abuse_checker.get_blacklist(limit=limit, min_score=min_score)
    return {"total": len(ips), "ips": ips}


@analyse_router.get("/abuse/check")
async def check_ip(ip: str = Query(...)) -> dict:
    result = await abuse_checker.check(ip)
    return {"ip": ip, "result": result.to_dict()}


@analyse_router.get("/abuse/stats")
async def abuse_stats() -> dict:
    return abuse_checker.stats()
