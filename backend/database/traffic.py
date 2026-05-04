"""Network traffic repository functions backed by MongoDB."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from . import _get_traffic_col

log = logging.getLogger(__name__)


def is_available() -> bool:
    return _get_traffic_col() is not None


def serialize_traffic(record: dict[str, Any]) -> dict[str, Any]:
    record = dict(record)
    record["id"] = str(record.pop("_id"))
    if isinstance(record.get("timestamp"), datetime):
        record["timestamp"] = record["timestamp"].isoformat()
    return record


async def create_traffic_record(record: dict[str, Any]) -> str | None:
    col = _get_traffic_col()
    if col is None:
        return None
    document = {"timestamp": datetime.now(timezone.utc), **record}
    try:
        result = await col.insert_one(document)
        return str(result.inserted_id)
    except Exception as exc:
        log.warning("Failed to save traffic record: %s", exc)
        return None


async def list_traffic(limit: int = 50) -> list[dict[str, Any]]:
    col = _get_traffic_col()
    if col is None:
        return []
    # ...

    try:
        cursor = _get_traffic_col().find().sort("timestamp", -1).limit(limit)
        return [serialize_traffic(record) async for record in cursor]
    except Exception as exc:
        log.warning("Failed to list traffic records: %s", exc)
        return []


async def list_traffic_by_ip(src_ip: str, limit: int = 50) -> list[dict[str, Any]]:
    if _get_traffic_col() is None:
        return []

    try:
        cursor = (
            _get_traffic_col()
            .find({"src_ip": src_ip})
            .sort("timestamp", -1)
            .limit(limit)
        )
        return [serialize_traffic(record) async for record in cursor]
    except Exception as exc:
        log.warning("Failed to list traffic by IP: %s", exc)
        return []
