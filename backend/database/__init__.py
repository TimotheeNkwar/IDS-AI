"""MongoDB data layer for IDS-AI."""

from __future__ import annotations

import logging

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
traffic_stats_col: AsyncIOMotorCollection | None = None
user_col: AsyncIOMotorCollection | None = None


async def connect_db() -> bool:
    global client, db, alerts_col, traffic_col, traffic_stats_col, user_col

    if not settings.MONGO_ENABLED:
        log.info("MongoDB disabled via MONGO_ENABLED=false")
        return False

    try:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command("ping")
        db = client[settings.MONGO_DB]

        alerts_col = db.alerts
        traffic_col = db.network_traffic
        traffic_stats_col = db.network_traffic_stats
        user_col = db.users

        await _ensure_indexes()
        log.info("MongoDB connecté: %s/%s", settings.MONGO_URI, settings.MONGO_DB)
        return True

    except Exception as exc:
        client = db = alerts_col = traffic_col = traffic_stats_col = user_col = None
        log.warning("MongoDB indisponible: %s", exc)
        return False


async def close_db() -> None:
    global client, db, alerts_col, traffic_col, traffic_stats_col, user_col
    if client:
        client.close()
    client = db = alerts_col = traffic_col = traffic_stats_col = user_col = None


def is_connected() -> bool:
    return all([db, alerts_col, traffic_col, traffic_stats_col, user_col])


async def _ensure_indexes() -> None:
    if db is None:
        return
    await db.alerts.create_index([("timestamp", -1)])
    await db.alerts.create_index([("severity", 1)])
    await db.alerts.create_index([("status", 1)])
    await db.alerts.create_index([("src_ip", 1)])
    await db.network_traffic.create_index([("timestamp", -1)])
    await db.network_traffic.create_index([("src_ip", 1)])
    await db.network_traffic_stats.create_index(
        [("window", 1), ("proto", 1), ("service", 1)],
        unique=True,
    )
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
