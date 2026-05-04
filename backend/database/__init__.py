"""MongoDB data layer for IDS-AI."""

from __future__ import annotations

import logging
from typing import Any

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
    AsyncIOMotorCollection,
)
from config.config import settings

log = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


alerts_col: AsyncIOMotorCollection | None = None
traffic_col: AsyncIOMotorCollection | None = None
user_col: AsyncIOMotorCollection | None = None


async def connect_db() -> bool:
    global client, db, alerts_col, traffic_col, user_col
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command("ping")
        db = client[settings.MONGO_DB]

        alerts_col = db.alerts
        traffic_col = db.network_traffic
        user_col = db.users

        await _ensure_indexes()

        import sys

        log.info("✅ alerts_col: %s", alerts_col)
        log.info("✅ traffic_col: %s", traffic_col)
        log.info("✅ MODULE ID: %s", id(sys.modules["database"]))  # ← diagnostic clé
        log.info("MongoDB connecté: %s/%s", settings.MONGO_URI, settings.MONGO_DB)
        return True

    except Exception as exc:
        client = None
        db = None
        alerts_col = None
        traffic_col = None
        log.warning("MongoDB indisponible: %s", exc)
        return False


async def close_db() -> None:
    global client, db, alerts_col, traffic_col, user_col
    if client:
        client.close()
    client = None
    db = None
    alerts_col = None
    traffic_col = None


def get_db() -> AsyncIOMotorDatabase | None:
    return db


def is_connected() -> bool:
    return db is not None


async def _ensure_indexes() -> None:
    if db is None:
        return
    await db.alerts.create_index("timestamp")
    await db.alerts.create_index("severity")
    await db.alerts.create_index("status")
    await db.alerts.create_index("src_ip")
    await db.network_traffic.create_index("timestamp")
    await db.network_traffic.create_index("src_ip")


def _get_alerts_col():
    return alerts_col


def _get_traffic_col():
    return traffic_col
