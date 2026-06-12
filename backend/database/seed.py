# database/seed.py
import asyncio
import uuid
from datetime import datetime, timezone

import database
from database import connect_db
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


async def seed():
    await connect_db()

    if database.user_col is None:
        print("❌ MongoDB connection failed. Cannot seed data.")
        return

    existing = await database.user_col.find_one({"email": "admin@test.com"})
    if existing:
        print(f"ℹ️ Admin user already exists with email: {existing['email']}")
        return

    admin = {
        "_id": str(uuid.uuid4()),
        "email": "admin@test.com",
        "username": "admin",
        "password_hash": password_hash.hash("admin123"),
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }

    await database.user_col.insert_one(admin)
    print(f"✅ Admin user created with email: {admin['email']}")

    await database.close_db()


if __name__ == "__main__":
    asyncio.run(seed())
