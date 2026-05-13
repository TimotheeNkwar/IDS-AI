# ── Health & Status ────────────────────────────────────────────────────────────

# ── Endpoints ──────────────────────────────────────────────────────────────────
from datetime import datetime, timezone
from typing import Any
import logging

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from bson import json_util
import json

from helpers.helper import (
    _build_raw_log,
    _final_confidence,
    _save_alert,
    _severity,
    _save_traffic_stats,
)
from ml import detector
from schemas.schemas import AlertStatusUpdate, AnalysisResult, LogEvent
from ml import detector
from schemas.schemas import AlertStatusUpdate, AnalysisResult, LogEvent
from ml import model as llm_module
from config.config import settings
from database import traffic as traffic_repo, alerts as alert_repo
from router.websockets_router import manager, _broadcast_dashboard_update
from helpers.security_helper import _prepare_for_llm, _should_force_llm
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

log = logging.getLogger(__name__)

health_router = APIRouter()
@health_router.get("/health", summary="Health check")
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
        "stats_storage_connected":   traffic_repo.is_stats_available(),
    }


@health_router.get("/status")
async def api_status() -> dict[str, Any]:
    return {
        "status":    "operational",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

