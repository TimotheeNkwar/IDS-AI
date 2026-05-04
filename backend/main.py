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

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# from helpers.helper import (
#     _severity,
#     _build_raw_log,
#     _final_confidence,
#     _save_alert,
#     _save_traffic,
# )
from router.analyse import analyse_router
from router.user import router as user_router

sys.path.append(str(Path(__file__).resolve().parents[1]))

load_dotenv(Path(__file__).with_name(".env"))
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

from ml import detector
from ml import model as llm_module


import database
from database import config as db_config

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

    yield
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
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(analyse_router, prefix="/api", tags=["analysis"])
app.include_router(user_router, prefix="/api/users", tags=["users"])


# ── Request / Response models ──────────────────────────────────────────────────
