import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ids_ai")

client: AsyncIOMotorClient = None


async def connect_db():
    """Open the database connection."""
    global client
    client = AsyncIOMotorClient(MONGO_URI)


async def close_db():
    """Close the database connection."""
    global client
    if client:
        client.close()


def get_database():
    """Return the active database instance."""
    return client[DATABASE_NAME]
