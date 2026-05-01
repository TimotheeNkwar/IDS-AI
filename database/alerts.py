# type: ignore
"""Alert repository functions backed by MongoDB."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from . import config

try:
    from bson import ObjectId
except ImportError:
    ObjectId = None

log = logging.getLogger(__name__)


def _collection():
    db = config.get_db()
    if db is None:
        return None
    return db.alerts


def is_available() -> bool:
    return _collection() is not None


def serialize_alert(alert: dict[str, Any]) -> dict[str, Any]:
    alert = dict(alert)
    alert["id"] = str(alert.pop("_id"))
    if isinstance(alert.get("timestamp"), datetime):
        alert["timestamp"] = alert["timestamp"].isoformat()
    if isinstance(alert.get("updated_at"), datetime):
        alert["updated_at"] = alert["updated_at"].isoformat()
    return alert


async def create_alert(alert: dict[str, Any]) -> str | None:
    collection = _collection()
    if collection is None:
        return None

    document = {
        "timestamp": datetime.now(timezone.utc),
        "status": "open",
        **alert,
    }
    try:
        result = await collection.insert_one(document)
        return str(result.inserted_id)
    except Exception as exc:
        log.warning("Failed to save alert: %s", exc)
        return None


async def list_alerts(limit: int = 50) -> list[dict[str, Any]]:
    collection = _collection()
    if collection is None:
        return []

    try:
        cursor = collection.find().sort("timestamp", -1).limit(limit)
        return [serialize_alert(alert) async for alert in cursor]
    except Exception as exc:
        log.warning("Failed to list alerts: %s", exc)
        return []


async def update_alert_status(alert_id: str, status: str) -> bool | None:
    collection = _collection()
    if collection is None:
        return None

    if ObjectId is None:
        raise ValueError("MongoDB ObjectId support is unavailable")

    try:
        object_id = ObjectId(alert_id)
    except Exception as exc:
        raise ValueError("Invalid alert id") from exc

    result = await collection.update_one(
        {"_id": object_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
    )
    return result.matched_count > 0
