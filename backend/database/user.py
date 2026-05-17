"""User repository functions backed by MongoDB."""

from __future__ import annotations
import logging
from pymongo.errors import DuplicateKeyError
from typing import Any
import database

try:
    from bson import ObjectId
except ImportError:
    ObjectId = None

log = logging.getLogger(__name__)


def is_available() -> bool:
    return database.user_col is not None


def serialize_user(user: dict[str, Any]) -> dict[str, Any]:
    user = dict(user)
    user["id"] = str(user.pop("_id"))
    return user


async def create_user(user_dict: dict) -> str | None:
    if database.user_col is None:
        return None
    try:
        result = await database.user_col.insert_one(dict(user_dict))
        return str(result.inserted_id) if result.inserted_id else None
    except DuplicateKeyError:
        return None


async def list_users() -> list[dict[str, Any]]:
    if database.user_col is None:
        return []
    try:
        cursor = database.user_col.find()
        return [serialize_user(u) async for u in cursor]
    except Exception as exc:
        log.warning("Failed to list users: %s", exc)
        return []


async def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    if database.user_col is None:
        return None
    try:
        user = await database.user_col.find_one({"_id": user_id})  # ← pas de ObjectId()
        return serialize_user(user) if user else None
    except Exception as exc:
        log.warning("Failed to get user by ID: %s", exc)
        return None


async def get_user_by_email(email: str) -> dict[str, Any] | None:
    if database.user_col is None:
        return None
    try:
        user = await database.user_col.find_one({"email": email})
        return serialize_user(user) if user else None
    except Exception as exc:
        log.warning("Failed to get user by email: %s", exc)
        return None


async def get_user_by_username(username: str) -> dict[str, Any] | None:
    if database.user_col is None:
        return None
    try:
        user = await database.user_col.find_one({"username": username})
        return serialize_user(user) if user else None
    except Exception as exc:
        log.warning("Failed to get user by username: %s", exc)
        return None


async def delete_user(user_id: str) -> bool:
    if database.user_col is None or ObjectId is None:
        return False
    try:
        result = await database.user_col.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    except Exception as exc:
        log.warning("Failed to delete user: %s", exc)
        return False


async def update_user(user_id: str, update_data: dict[str, Any]) -> bool:
    if database.user_col is None or ObjectId is None:
        return False
    try:
        result = await database.user_col.update_one(
            {"_id": ObjectId(user_id)}, {"$set": update_data}
        )
        return result.matched_count > 0
    except Exception as exc:
        log.warning("Failed to update user: %s", exc)
        return False
