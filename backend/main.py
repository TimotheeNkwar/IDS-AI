# type: ignore
"""
IDS-AI — FastAPI application
POST /analyze  — run the full IDS pipeline (ML + optional LLM)
GET  /health   — system status
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import detector
import model as llm_module

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

    yield
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
    allow_methods=["GET", "POST"],
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
    # LLM layer (only when anomaly)
    classification: str              # "Normal" | "Suspicious" | "Malicious"
    llm_confidence: float
    explanation: str
    llm_available: bool
    # Summary
    severity: str                    # "low" | "medium" | "high"
    src_ip: str
    dst_ip: str


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

    # Step 4: LLM analysis (only for anomalies)
    if is_anomaly:
        log_text = event.raw_log or _build_raw_log(event)
        llm_result = llm_module.analyze_with_llm(log_text)
    else:
        llm_result = {
            "classification": "Normal",
            "llm_confidence": ml_conf,
            "explanation": "Traffic classified as normal by the ML model. No LLM analysis required.",
            "llm_available": True,
        }

    classification: str = llm_result["classification"]
    severity = _severity(is_anomaly, classification, ml_conf)

    return AnalysisResult(
        timestamp=datetime.now(timezone.utc).isoformat(),
        ml_label=ml_label,
        ml_confidence=ml_conf,
        ml_model=ml_model,
        is_anomaly=is_anomaly,
        attack_type=attack_type,
        classification=classification,
        llm_confidence=llm_result["llm_confidence"],
        explanation=llm_result["explanation"],
        llm_available=llm_result["llm_available"],
        severity=severity,
        src_ip=event.src_ip,
        dst_ip=event.dst_ip,
    )


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
    }


# ── Legacy endpoints (kept for backward compatibility) ─────────────────────────

@app.get("/api/status")
async def api_status() -> dict[str, Any]:
    return {"status": "operational", "timestamp": datetime.now(timezone.utc).isoformat()}
