# type: ignore
"""MongoDB connection helpers for IDS-AI."""

from __future__ import annotations

import logging
import os
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()

log = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ids_ai")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ids_ai")
MONGO_ENABLED = os.getenv("MONGO_ENABLED", "true").lower() not in ("false", "0", "no")

try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
except ImportError:
    AsyncIOMotorClient = None
    AsyncIOMotorDatabase = Any

client: Any | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> bool:
    """Initialize MongoDB and return whether the connection is available."""
    global client, db

    if not MONGO_ENABLED:
        log.info("MongoDB disabled via MONGO_ENABLED=false")
        return False

    if AsyncIOMotorClient is None:
        log.warning("motor is not installed; MongoDB persistence is unavailable")
        return False

    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command("ping")
        db = client[DATABASE_NAME]
        await ensure_indexes()
        log.info("MongoDB connected: %s/%s", MONGO_URI, DATABASE_NAME)
        return True
    except Exception as exc:
        client = None
        db = None
        log.warning("MongoDB unavailable: %s", exc)
        return False


async def close_db() -> None:
    """Close the MongoDB connection."""
    global client, db
    if client is not None:
        client.close()
    client = None
    db = None


def get_db() -> AsyncIOMotorDatabase | None:
    """Return the MongoDB database instance, if connected."""
    return db


def is_connected() -> bool:
    """Return whether MongoDB persistence is currently available."""
    return db is not None


async def ensure_indexes() -> None:
    """Create indexes used by the alert dashboard and alert workflow."""
    if db is None:
        return

    await db.alerts.create_index("timestamp")
    await db.alerts.create_index("severity")
    await db.alerts.create_index("status")
    await db.alerts.create_index("source_ip")
    await db.network_traffic.create_index("timestamp")
    await db.network_traffic.create_index("source_ip")
