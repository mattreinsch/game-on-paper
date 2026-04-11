import pytest
import json
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_redis():
    with patch("cache.redis_client") as mock_r:
        yield mock_r


def test_cache_get_miss(mock_redis):
    from cache import cache_get
    mock_redis.get.return_value = None
    assert cache_get("missing_key") is None


def test_cache_get_hit(mock_redis):
    from cache import cache_get
    mock_redis.get.return_value = json.dumps({"foo": "bar"}).encode()
    result = cache_get("some_key")
    assert result == {"foo": "bar"}


def test_cache_set(mock_redis):
    from cache import cache_set
    cache_set("my_key", {"x": 1}, ttl=3600)
    mock_redis.set.assert_called_once_with(
        "my_key", json.dumps({"x": 1}), ex=3600
    )
