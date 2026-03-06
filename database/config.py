#type: ignore

import os
from motor.motor_asyncio import AsyncClient, AsyncDatabase
from dotenv import load_dotenv

load_dotenv()

MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = os.getenv("MONGO_PORT", "27017")
MONGO_USER = os.getenv("MONGO_USER", "")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ids_ai")

# Construct MongoDB connection string
if MONGO_USER and MONGO_PASSWORD:
    MONGODB_URL = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{DATABASE_NAME}"
else:
    MONGODB_URL = f"mongodb://{MONGO_HOST}:{MONGO_PORT}/{DATABASE_NAME}"

client: AsyncClient = None
db: AsyncDatabase = None


async def connect_db():
    """Initialize the MongoDB client and database connection."""
    global client, db
    client = AsyncClient(MONGODB_URL)
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
