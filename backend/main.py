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
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from ml import detector
from ml import model as llm_module
import database

from router.analyse import analyse_router, start_analysis_worker, stop_analysis_worker
from router.users import router as user_router
from router.websockets_router import socket_router
from router.health import health_router
from router.stats import stats_router
from router.suggestion import suggestions_router

sys.path.append(str(Path(__file__).resolve().parents[1]))

load_dotenv(Path(__file__).with_name(".env"))
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s"
)
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

    await database.connect_db()
    await start_analysis_worker()

    yield
    await stop_analysis_worker()
    await database.close_db()
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
    allow_origins=os.getenv("CORS_ORIGINS").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(analyse_router, prefix="/api", tags=["analysis"])
app.include_router(user_router, prefix="/api/users", tags=["users"])
app.include_router(socket_router, prefix="/api", tags=["websockets"])
app.include_router(stats_router, prefix="/api", tags=["stats"])
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(suggestions_router, prefix="/api", tags=["suggestions"])


# ── Request / Response models ──────────────────────────────────────────────────


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="10.30.199.223", port=int(os.getenv("PORT", "8000")))