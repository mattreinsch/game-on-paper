import json
import os
from typing import Optional

import redis

try:
    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    redis_client.ping()
    _redis_available = True
except Exception:
    redis_client = None
    _redis_available = False


def cache_get(key: str) -> Optional[dict]:
    if not _redis_available:
        return None
    try:
        val = redis_client.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


def cache_set(key: str, value: dict, ttl: int) -> None:
    if not _redis_available:
        return
    try:
        redis_client.set(key, json.dumps(value), ex=ttl)
    except Exception:
        pass
