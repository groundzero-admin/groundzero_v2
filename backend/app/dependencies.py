import redis.asyncio as aioredis

from app.config import settings
from app.database import get_db  # noqa: F401 — re-exported for convenience

_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_pool
