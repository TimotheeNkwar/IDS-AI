# type: ignore
"""
IDS-AI — FastAPI application
POST /analyze  — run the full IDS pipeline (ML + optional LLM)
GET  /health   — system status
"""

from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

sys.path.append(str(Path(__file__).resolve().parents[1]))

load_dotenv(Path(__file__).with_name(".env"))
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

import detector
import model as llm_module
from database import alerts as alert_repo
from database import config as db_config
from database import traffic as traffic_repo

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger(__name__)


# ── Startup / shutdown ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("IDS-AI starting — pre-loading ML model bundle …")
    bundle = detector._load_bundle()
    if bundle:
        log.info("ML model ready: %s", bundle["model_name"])
    else:
        log.warning("ML model not loaded — run train.py to generate best_model.joblib")

    if os.getenv("LLM_PRELOAD", "false").lower() in ("true", "1"):
        log.info("Pre-loading LLM …")
        llm_module._load_pipeline()

    await db_config.connect_db()

    yield
    await db_config.close_db()
    log.info("IDS-AI shutting down")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="IDS-AI API",
    version="2.0.0",
    description="Hybrid Intrusion Detection System — ML + LLM",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)


# ── Request / Response models ──────────────────────────────────────────────────

class LogEvent(BaseModel):
    """Network log event — all fields are optional and default to safe values."""
    src_ip: str = Field(default="0.0.0.0", description="Source IP address")
    dst_ip: str = Field(default="0.0.0.0", description="Destination IP address")
    src_port: int = Field(default=0, ge=0, le=65535)
    dst_port: int = Field(default=0, ge=0, le=65535)
    proto: str = Field(default="tcp", description="Protocol: tcp | udp | icmp")
    service: str = Field(default="-")
    conn_state: str = Field(default="OTH")
    duration: float = Field(default=0.0, ge=0)
    src_bytes: int = Field(default=0, ge=0)
    dst_bytes: int = Field(default=0, ge=0)
    missed_bytes: int = Field(default=0, ge=0)
    src_pkts: int = Field(default=0, ge=0)
    src_ip_bytes: int = Field(default=0, ge=0)
    dst_pkts: int = Field(default=0, ge=0)
    dst_ip_bytes: int = Field(default=0, ge=0)
    dns_qclass: int = Field(default=0, ge=0)
    dns_qtype: int = Field(default=0, ge=0)
    dns_rcode: int = Field(default=0, ge=0)
    http_trans_depth: Any = Field(default=0)
    http_request_body_len: int = Field(default=0, ge=0)
    http_response_body_len: int = Field(default=0, ge=0)
    http_status_code: int = Field(default=0, ge=0)
    # Raw log string forwarded to the LLM when anomaly is detected
    raw_log: str | None = Field(default=None, description="Optional raw log text for LLM analysis")


class AnalysisResult(BaseModel):
    timestamp: str
    # ML layer
    ml_label: str                    # "normal" | <attack_type>
    ml_confidence: float
    ml_model: str
    is_anomaly: bool
    attack_type: str | None          # e.g. "ddos", "injection", None when normal
    risk_signals: list[dict[str, Any]]
    top_features: list[dict[str, Any]]
    # LLM layer (only when anomaly)
    classification: str              # "Normal" | "Suspicious" | "Malicious"
    llm_attack_type: str | None = None
    llm_severity: str | None = None
    llm_confidence: float
    evidence: list[str] = Field(default_factory=list)
    knowledge_matches: list[str] = Field(default_factory=list)
    explanation: str
    recommended_action: str
    needs_manual_review: bool
    llm_available: bool
    # Summary
    final_confidence: float
    severity: str                    # "low" | "medium" | "high"
    src_ip: str
    dst_ip: str


class AlertStatusUpdate(BaseModel):
    status: str = Field(pattern="^(open|reviewing|resolved|false_positive)$")


# ── Helper ─────────────────────────────────────────────────────────────────────

def _severity(is_anomaly: bool, classification: str, ml_conf: float) -> str:
    if not is_anomaly:
        return "low"
    if classification == "Malicious" or ml_conf >= 0.85:
        return "high"
    if classification == "Suspicious" or ml_conf >= 0.60:
        return "medium"
    return "low"


def _build_raw_log(event: LogEvent) -> str:
    """Construct a human-readable log string for the LLM."""
    return (
        f"src={event.src_ip}:{event.src_port} dst={event.dst_ip}:{event.dst_port} "
        f"proto={event.proto} service={event.service} conn_state={event.conn_state} "
        f"duration={event.duration}s src_bytes={event.src_bytes} dst_bytes={event.dst_bytes} "
        f"missed={event.missed_bytes} src_pkts={event.src_pkts} dst_pkts={event.dst_pkts} "
        f"http_status={event.http_status_code}"
    )


def _final_confidence(ml_confidence: float, llm_confidence: float, llm_available: bool) -> float:
    if not llm_available:
        return round(ml_confidence, 2)
    return round((0.7 * ml_confidence) + (0.3 * llm_confidence), 2)


async def _save_alert(result: AnalysisResult) -> None:
    await alert_repo.create_alert({
        "type": result.attack_type or result.ml_label,
        "message": result.explanation,
        "source_ip": result.src_ip,
        "destination_ip": result.dst_ip,
        "severity": result.severity,
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
    })


async def _save_traffic(event: LogEvent, result: AnalysisResult, raw_event: dict[str, Any]) -> None:
    await traffic_repo.create_traffic_record({
        "source_ip": event.src_ip,
        "destination_ip": event.dst_ip,
        "protocol": event.proto,
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
    })


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalysisResult, summary="Analyze a network log event")
async def analyze(event: LogEvent) -> AnalysisResult:
    """
    Full IDS pipeline:
    1. Preprocess input features
    2. ML model predicts normal / attack + confidence
    3. If anomaly → LLM classifies: Normal / Suspicious / Malicious
    4. Return combined result with severity and explanation
    """
    raw = event.model_dump()

    # Step 1-3: ML prediction
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

    # Step 4: LLM analysis (only for anomalies)
    if is_anomaly:
        log_text = event.raw_log or _build_raw_log(event)
        llm_result = llm_module.analyze_with_llm(
            log_text,
            {
                "ml_label": ml_label,
                "ml_confidence": ml_conf,
                "ml_model": ml_model,
                "attack_type": attack_type,
                "risk_signals": risk_signals,
                "top_features": top_features,
            },
        )
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
    final_conf = _final_confidence(ml_conf, llm_result["llm_confidence"], llm_result["llm_available"])
    severity = _severity(is_anomaly, classification, ml_conf)

    result = AnalysisResult(
        timestamp=datetime.now(timezone.utc).isoformat(),
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
    )

    if is_anomaly:
        await _save_alert(result)

    await _save_traffic(event, result, raw)

    return result


@app.get("/health", summary="Health check")
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
    }


# ── Legacy endpoints (kept for backward compatibility) ─────────────────────────

@app.get("/api/status")
async def api_status() -> dict[str, Any]:
    return {"status": "operational", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/alerts")
async def api_alerts(limit: int = Query(default=50, ge=1, le=200)) -> dict[str, Any]:
    if not alert_repo.is_available():
        return {"alerts": [], "storage_available": False}

    return {"alerts": await alert_repo.list_alerts(limit), "storage_available": True}


@app.patch("/api/alerts/{alert_id}/status")
async def update_alert_status(alert_id: str, payload: AlertStatusUpdate) -> dict[str, Any]:
    if not alert_repo.is_available():
        raise HTTPException(status_code=503, detail="Alert storage unavailable")

    try:
        updated = await alert_repo.update_alert_status(alert_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"id": alert_id, "status": payload.status}


@app.get("/api/traffic")
async def api_traffic(limit: int = Query(default=50, ge=1, le=200)) -> dict[str, Any]:
    if not traffic_repo.is_available():
        return {"traffic": [], "storage_available": False}

    return {"traffic": await traffic_repo.list_traffic(limit), "storage_available": True}
