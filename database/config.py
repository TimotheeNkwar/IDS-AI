#type: ignore

import os
from motor.motor_asyncio import AsyncClient, AsyncDatabase
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ids_ai")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ids_ai")

client: AsyncClient = None
db: AsyncDatabase = None


async def connect_db():
    """Initialize the MongoDB client and database connection."""
    global client, db
    client = AsyncClient(MONGO_URI)
    db = client[DATABASE_NAME]
    # Test connection
    await client.admin.command('ping')


async def close_db():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()


async def get_db():
    """Return the MongoDB database instance."""
    return db
