import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

_client = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            os.getenv("MONGODB_URL", "mongodb://localhost:27017"),
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_tasks_collection():
    """FastAPI dependency returning the `tasks` collection of the `planmyday` database."""
    return get_client()[os.getenv("DATABASE_NAME", "planmyday")]["tasks"]


async def init_db() -> None:
    """Create the index used by the per-user task queries."""
    await get_tasks_collection().create_index([("username", 1), ("date", 1)])


async def ping(timeout: float = 2.5) -> bool:
    """True when MongoDB answers; never raises (used by the health check)."""
    try:
        await asyncio.wait_for(get_client().admin.command("ping"), timeout=timeout)
        return True
    except Exception:
        return False


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
