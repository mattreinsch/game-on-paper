import pytest
from httpx import AsyncClient


async def test_healthcheck(client: AsyncClient):
    response = await client.get("/healthcheck")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
