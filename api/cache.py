import json
import os
from typing import Optional

import redis

redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))


def cache_get(key: str) -> Optional[dict]:
    val = redis_client.get(key)
    return json.loads(val) if val else None


def cache_set(key: str, value: dict, ttl: int) -> None:
    redis_client.set(key, json.dumps(value), ex=ttl)
