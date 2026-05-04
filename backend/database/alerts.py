"""Alert repository functions backed by MongoDB."""

# database/alerts.py
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import Any
from . import get_db
from . import _get_alerts_col

# ...
try:
    from bson import ObjectId
except ImportError:
    ObjectId = None

log = logging.getLogger(__name__)


def serialize_alert(alert: dict[str, Any]) -> dict[str, Any]:
    alert = dict(alert)
    alert["id"] = str(alert.pop("_id"))
    if isinstance(alert.get("timestamp"), datetime):
        alert["timestamp"] = alert["timestamp"].isoformat()
    if isinstance(alert.get("updated_at"), datetime):
        alert["updated_at"] = alert["updated_at"].isoformat()
    return alert


def is_available() -> bool:
    return _get_alerts_col() is not None


async def create_alert(alert: dict[str, Any]) -> str | None:
    col = _get_alerts_col()
    log.warning("🔍 create_alert appelé — col=%s", col)
    if col is None:
        return None
    document = {"timestamp": datetime.now(timezone.utc), "status": "open", **alert}
    try:
        result = await col.insert_one(document)
        return str(result.inserted_id)
    except Exception as exc:
        log.warning("Failed to save alert: %s", exc)
        return None


async def list_alerts(limit: int = 50) -> list[dict[str, Any]]:
    col = _get_alerts_col()
    if col is None:
        return []
    try:
        cursor = col.find().sort("timestamp", -1).limit(limit)
        return [serialize_alert(a) async for a in cursor]
    except Exception as exc:
        log.warning("Failed to list alerts: %s", exc)
        return []


async def update_alert_status(alert_id: str, status: str) -> bool | None:
    col = _get_alerts_col()
    if col is None:
        return None

    if ObjectId is None:
        raise ValueError("MongoDB ObjectId support is unavailable")

    try:
        object_id = ObjectId(alert_id)
    except Exception as exc:
        raise ValueError("Invalid alert id") from exc

    result = await col.update_one(
        {"_id": object_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
    )
    return result.matched_count > 0


def _get_alerts_col():
    import sys

    log.warning("MODULE ID depuis alerts.py: %s", id(sys.modules.get("database")))
    import database

    return database.alerts_col
