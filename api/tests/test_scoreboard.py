import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient

ESPN_GAME = {
    "id": "401628444",
    "date": "2025-09-06T18:00Z",
    "competitions": [
        {
            "competitors": [
                {
                    "homeAway": "home",
                    "score": "34",
                    "team": {
                        "id": "333",
                        "displayName": "Alabama Crimson Tide",
                        "logo": "https://a.espncdn.com/i/teamlogos/cfb/500/333.png",
                        "abbreviation": "ALA",
                        "rank": 1,
                    },
                },
                {
                    "homeAway": "away",
                    "score": "20",
                    "team": {
                        "id": "61",
                        "displayName": "Georgia Bulldogs",
                        "logo": "https://a.espncdn.com/i/teamlogos/cfb/500/61.png",
                        "abbreviation": "UGA",
                        "rank": None,
                    },
                },
            ],
            "status": {
                "type": {"name": "STATUS_FINAL", "completed": True},
                "period": 4,
                "displayClock": "0:00",
            },
        }
    ],
}

ESPN_RESPONSE = {"events": [ESPN_GAME]}


@pytest.fixture
def mock_cache_miss():
    with patch("routers.scoreboard.cache_get", return_value=None), \
         patch("routers.scoreboard.cache_set"):
        yield


async def test_scoreboard_cfb_returns_games(client: AsyncClient, mock_cache_miss):
    mock_resp = MagicMock()
    mock_resp.json.return_value = ESPN_RESPONSE
    mock_resp.raise_for_status = MagicMock()

    with patch("routers.scoreboard.httpx.AsyncClient") as MockHTTP:
        MockHTTP.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=mock_resp
        )
        response = await client.get(
            "/scoreboard/cfb", params={"year": "2025", "week": "1"}
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["games"]) == 1
    game = data["games"][0]
    assert game["id"] == "401628444"
    assert game["home_team"]["name"] == "Alabama Crimson Tide"
    assert game["away_team"]["score"] == 20
    assert "excitement_level" in game


async def test_excitement_level_close_ranked(mock_cache_miss):
    from routers.scoreboard import compute_excitement_level

    competition = {
        "competitors": [
            {"homeAway": "home", "score": "21", "team": {"rank": 5}},
            {"homeAway": "away", "score": "17", "team": {"rank": 10}},
        ],
        "status": {"type": {"name": "STATUS_IN_PROGRESS"}, "period": 4},
    }
    assert compute_excitement_level(competition) == "orange"


async def test_excitement_level_ranked_upset(mock_cache_miss):
    from routers.scoreboard import compute_excitement_level

    competition = {
        "competitors": [
            {"homeAway": "home", "score": "17", "team": {"rank": 3}},
            {"homeAway": "away", "score": "24", "team": {"rank": None}},
        ],
        "status": {"type": {"name": "STATUS_IN_PROGRESS"}, "period": 4},
    }
    assert compute_excitement_level(competition) == "yellow"


async def test_scoreboard_uses_cache(client: AsyncClient):
    cached = {"games": [{"id": "from_cache"}]}
    with patch("routers.scoreboard.cache_get", return_value=cached):
        response = await client.get(
            "/scoreboard/cfb", params={"year": "2025", "week": "1"}
        )
    assert response.status_code == 200
    assert response.json()["games"][0]["id"] == "from_cache"
