"""Alert repository functions backed by MongoDB."""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any
from bson import json_util
from bson import ObjectId
import json
from . import _get_alerts_col

log = logging.getLogger(__name__)


def is_available() -> bool:
    return _get_alerts_col() is not None


def serialize_alert(record: dict[str, Any]) -> dict[str, Any]:
    record = dict(record)
    record["id"] = str(record.pop("_id"))
    if isinstance(record.get("timestamp"), datetime):
        record["timestamp"] = record["timestamp"].isoformat()
    return record


# ── CRUD ───────────────────────────────────────────────────────────────────────

async def create_alert(record: dict[str, Any]) -> str | None:
    col = _get_alerts_col()
    if col is None:
        return None
    document = {"timestamp": datetime.now(timezone.utc), **record}
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


async def update_alert_status(alert_id: str, status: str) -> bool:
    col = _get_alerts_col()
    if col is None:
        return False
    try:
        result = await col.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
    except Exception as exc:
        log.warning("Failed to update alert status: %s", exc)
        return False


# ── Stats ──────────────────────────────────────────────────────────────────────

async def count_by_attack_type(hours: int = 24) -> list[dict[str, Any]]:
    col = _get_alerts_col()
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},  # ✅ filtre 24h
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to count by attack type: %s", exc)
        return []


async def count_by_severity(hours: int = 24) -> list[dict[str, Any]]:
    col = _get_alerts_col()
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to count by severity: %s", exc)
        return []

async def count_by_status() -> list[dict[str, Any]]:
    """Number of alerts by status — open/reviewing/resolved."""
    col = _get_alerts_col()
    if col is None:
        return []
    try:
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to count by status: %s", exc)
        return []


async def alerts_over_time(hours: int = 24) -> list[dict[str, Any]]:
    """Number of alerts by hour over the last X hours — line chart."""
    col = _get_alerts_col()
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {
                "_id": {
                    "year":  {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day":   {"$dayOfMonth": "$timestamp"},
                    "hour":  {"$hour": "$timestamp"},
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to get alerts over time: %s", exc)
        return []


async def top_source_ips(limit: int = 10) -> list[dict[str, Any]]:
    """Top IPs sources of attacks."""
    col = _get_alerts_col()
    if col is None:
        return []
    try:
        pipeline = [
            {"$group": {"_id": "$source_ip", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit}
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to get top source IPs: %s", exc)
        return []