# type: ignore
"""
IDS-AI — FastAPI application
POST /analyze  — run the full IDS pipeline (ML + optional LLM)
GET  /health   — system status
"""

from __future__ import annotations
import sys
import os

import logging
from ml import detector
from ml import model as llm_module


import database

from contextlib import asynccontextmanager

from pathlib import Path


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from llm_queue.llm_queue import llm_queue

sys.path.append(str(Path(__file__).resolve().parents[1]))

from router.analyse.analyse import analyse_router
from router.users.user import user_router
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
    await llm_queue.start()

    yield
    await llm_queue.stop()
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
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analyse_router, prefix="/api", tags=["analysis"])
app.include_router(user_router, prefix="/api/users", tags=["users"])
app.include_router(socket_router, prefix="/api", tags=["websockets"])
app.include_router(stats_router, prefix="/api", tags=["stats"])
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(suggestions_router, prefix="/api", tags=["suggestions"])


# ── Request / Response models ─────────────────────────────────────────────────
