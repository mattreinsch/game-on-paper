import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient

MOCK_PBP_JSON = {
    "header": {
        "id": "401628444",
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
    },
    "plays": [
        {
            "id": "1",
            "text": "First play",
            "start": {"down": 1, "distance": 10, "yardsToEndzone": 75},
            "end": {},
            "wallclock": "2025-09-06T18:02:00Z",
        }
    ],
    "winProbability": [
        {
            "playId": "1",
            "homeWinPercentage": 0.55,
            "secondsLeft": 3600,
        }
    ],
    "boxScore": {
        "teams": [],
        "players": [],
    },
    "drives": {
        "previous": [
            {
                "id": "1",
                "description": "TD",
                "yards": 75,
                "plays": {"number": 8},
                "start": {"text": "OWN 25"},
                "end": {"text": "OPP 0"},
                "result": "TD",
            }
        ]
    },
}


@pytest.fixture
def mock_cache_miss():
    with patch("routers.game.cache_get", return_value=None), \
         patch("routers.game.cache_set"):
        yield


def make_mock_process(pbp_json: dict):
    mock_process = MagicMock()
    mock_process.json = pbp_json
    mock_process.espn_cfb_pbp = MagicMock(return_value=pbp_json)
    mock_process.run_processing_pipeline = MagicMock()
    return mock_process


async def test_get_game_cfb_returns_normalized_data(
    client: AsyncClient, mock_cache_miss
):
    mock_process = make_mock_process(MOCK_PBP_JSON)

    with patch("routers.game.CFBPlayProcess", return_value=mock_process):
        response = await client.get("/game/cfb/401628444")

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == "401628444"
    assert data["home_team"]["name"] == "Alabama Crimson Tide"
    assert data["away_team"]["name"] == "Georgia Bulldogs"
    assert len(data["plays"]) == 1
    assert len(data["win_probability"]) == 1
    assert data["win_probability"][0]["home_wp"] == 0.55
    assert len(data["drives"]) == 1


async def test_get_game_uses_cache(client: AsyncClient):
    cached = {"game_id": "from_cache", "status": "final"}
    with patch("routers.game.cache_get", return_value=cached):
        response = await client.get("/game/cfb/401628444")
    assert response.json()["game_id"] == "from_cache"


async def test_get_game_unknown_sport(client: AsyncClient):
    with patch("routers.game.cache_get", return_value=None):
        response = await client.get("/game/mlb/401628444")
    assert response.status_code == 404


async def test_final_game_cached_24h(client: AsyncClient, mock_cache_miss):
    mock_process = make_mock_process(MOCK_PBP_JSON)

    with patch("routers.game.CFBPlayProcess", return_value=mock_process), \
         patch("routers.game.cache_set") as mock_set:
        await client.get("/game/cfb/401628444")

    # STATUS_FINAL -> 24h TTL = 86400 seconds
    mock_set.assert_called_once()
    args = mock_set.call_args[0]
    assert args[2] == 86400
