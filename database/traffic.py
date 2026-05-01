# type: ignore
"""Network traffic repository functions backed by MongoDB."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from . import config

log = logging.getLogger(__name__)


def _collection():
    db = config.get_db()
    if db is None:
        return None
    return db.network_traffic


def is_available() -> bool:
    return _collection() is not None


def serialize_traffic(record: dict[str, Any]) -> dict[str, Any]:
    record = dict(record)
    record["id"] = str(record.pop("_id"))
    if isinstance(record.get("timestamp"), datetime):
        record["timestamp"] = record["timestamp"].isoformat()
    return record


async def create_traffic_record(record: dict[str, Any]) -> str | None:
    collection = _collection()
    if collection is None:
        return None

    document = {
        "timestamp": datetime.now(timezone.utc),
        **record,
    }
    try:
        result = await collection.insert_one(document)
        return str(result.inserted_id)
    except Exception as exc:
        log.warning("Failed to save traffic record: %s", exc)
        return None


async def list_traffic(limit: int = 50) -> list[dict[str, Any]]:
    collection = _collection()
    if collection is None:
        return []

    try:
        cursor = collection.find().sort("timestamp", -1).limit(limit)
        return [serialize_traffic(record) async for record in cursor]
    except Exception as exc:
        log.warning("Failed to list traffic records: %s", exc)
        return []
