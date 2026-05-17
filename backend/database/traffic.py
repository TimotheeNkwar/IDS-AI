"""Network traffic repository functions backed by MongoDB."""

from __future__ import annotations
from bson import json_util
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import database

log = logging.getLogger(__name__)


def is_available() -> bool:
    return database.traffic_col is not None


def is_stats_available() -> bool:
    return database.traffic_stats_col is not None


def serialize_traffic(record: dict[str, Any]) -> dict[str, Any]:
    record = dict(record)
    record["id"] = str(record.pop("_id"))
    if isinstance(record.get("timestamp"), datetime):
        record["timestamp"] = record["timestamp"].isoformat()
    return record


# ── CRUD ───────────────────────────────────────────────────────────────────────


async def create_traffic_record(record: dict[str, Any]) -> str | None:
    col = database.traffic_col
    if col is None:
        return None
    document = {"timestamp": datetime.now(timezone.utc), **record}
    try:
        result = await col.insert_one(document)
        return str(result.inserted_id)
    except Exception as exc:
        log.warning("Failed to save traffic record: %s", exc)
        return None


async def list_traffic(limit: int = 50, hours: int = 24) -> list[dict[str, Any]]:
    col = database.traffic_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        cursor = (
            col.find({"timestamp": {"$gte": since}}).sort("timestamp", -1).limit(limit)
        )
        return [serialize_traffic(r) async for r in cursor]
    except Exception as exc:
        log.warning("Failed to list traffic records: %s", exc)
        return []


async def list_traffic_by_ip(
    src_ip: str, limit: int = 50, hours: int = 24
) -> list[dict[str, Any]]:
    col = database.traffic_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        cursor = (
            col.find({"src_ip": src_ip, "timestamp": {"$gte": since}})
            .sort("timestamp", -1)
            .limit(limit)
        )
        return [serialize_traffic(r) async for r in cursor]
    except Exception as exc:
        log.warning("Failed to list traffic by IP: %s", exc)
        return []


async def upsert_stats(
    window: datetime,
    protocol: str,
    service: str,
    src_ip: str,
    src_bytes: int,
    dst_bytes: int,
) -> None:
    col = database.traffic_stats_col
    if col is None:
        return
    try:
        await col.update_one(
            {"window": window, "protocol": protocol, "service": service},
            {
                "$inc": {"count": 1, "total_bytes": src_bytes + dst_bytes},
                "$set": {"last_seen": datetime.now(timezone.utc)},
                "$addToSet": {"unique_ips": src_ip},
            },
            upsert=True,
        )
    except Exception as exc:
        log.warning("Failed to upsert traffic stats: %s", exc)


# ── Stats ──────────────────────────────────────────────────────────────────────


async def count_by_protocol(hours: int = 24) -> list[dict[str, Any]]:
    col = database.traffic_stats_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"window": {"$gte": since}}},
            {"$group": {"_id": "$protocol", "total": {"$sum": "$count"}}},
            {"$sort": {"total": -1}},
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to count by protocol: %s", exc)
        return []


async def count_by_service(hours: int = 24) -> list[dict[str, Any]]:
    col = database.traffic_stats_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"window": {"$gte": since}}},
            {"$group": {"_id": "$service", "total": {"$sum": "$count"}}},
            {"$sort": {"total": -1}},
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to count by service: %s", exc)
        return []


async def traffic_over_time(hours: int = 24) -> list[dict[str, Any]]:
    """Get traffic volume over time for the last N hours, grouped by 5-minute windows."""
    col = database.traffic_stats_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"window": {"$gte": since}}},
            {"$sort": {"window": 1}},
            {
                "$project": {
                    "window": 1,
                    "protocol": 1,
                    "service": 1,
                    "count": 1,
                    "total_bytes": 1,
                }
            },
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to get traffic over time: %s", exc)
        return []


async def top_talkers(limit: int = 10, hours: int = 24) -> list[dict[str, Any]]:
    col = database.traffic_stats_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"window": {"$gte": since}}},
            {"$unwind": "$unique_ips"},
            {"$group": {"_id": "$unique_ips", "total": {"$sum": "$count"}}},
            {"$sort": {"total": -1}},
            {"$limit": limit},
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to get top talkers: %s", exc)
        return []


async def count_by_label(hours: int = 24) -> list[dict[str, Any]]:
    """Nombre de traffic par label — normal/suspicious/malicious."""
    col = database.traffic_stats_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"window": {"$gte": since}}},
            {"$group": {"_id": None, "total_normal": {"$sum": "$count"}}},
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to count by label: %s", exc)
        return []


async def count_suspicious_malicious(hours: int = 24) -> list[dict[str, Any]]:
    """Nombre de suspicious/malicious depuis network_traffic."""
    col = database.traffic_col
    if col is None:
        return []
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        results = await col.aggregate(pipeline).to_list(None)
        return json.loads(json_util.dumps(results))
    except Exception as exc:
        log.warning("Failed to count suspicious/malicious: %s", exc)
        return []
