# Game on Paper MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a sport-agnostic web app with a filterable game scoreboard and per-game detail view (play-by-play, win probability chart, box score, drives) for CFB and NFL.

**Architecture:** Next.js (app router, TypeScript, Tailwind) frontend calls a Python FastAPI backend that fetches ESPN data via `sportsdataverse`, caches responses in Redis, and returns normalized JSON. Both services run locally via Docker Compose; production deploys frontend to Vercel and API to Render.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 3, Recharts 2, Python 3.11, FastAPI 0.115, httpx 0.27, redis-py 5, sportsdataverse, pytest 8, pytest-asyncio 0.23, Jest 29, @testing-library/react 16, Docker Compose

---

## File Map

```
game_on_paper/
  docker-compose.yml
  .gitignore
  README.md

  api/
    Dockerfile
    requirements.txt
    pytest.ini
    main.py                     # FastAPI app, CORS, router registration
    cache.py                    # Redis get/set helpers
    routers/
      __init__.py
      scoreboard.py             # GET /scoreboard/{sport}
      game.py                   # GET /game/{sport}/{id}
    tests/
      conftest.py               # AsyncClient fixture
      test_healthcheck.py
      test_cache.py
      test_scoreboard.py
      test_game.py

  frontend/
    Dockerfile
    package.json
    tsconfig.json
    tailwind.config.ts
    postcss.config.js
    next.config.ts
    jest.config.ts
    jest.setup.ts
    app/
      globals.css
      layout.tsx                # Root layout with nav
      page.tsx                  # Redirects to /cfb
      [sport]/
        page.tsx                # Scoreboard page (server component)
        game/
          [id]/
            page.tsx            # Game detail page (server component)
    components/
      GameCard.tsx              # Single game row on scoreboard
      ScoreboardFilters.tsx     # Year/week/conference filter bar (client)
      WinProbChart.tsx          # Recharts line chart (client)
      BoxScore.tsx              # Team + player stats table
      DrivesSummary.tsx         # Drive-by-drive breakdown
    lib/
      api.ts                    # Typed fetch wrapper for FastAPI
      types.ts                  # Shared TypeScript types
    __tests__/
      api.test.ts
      GameCard.test.tsx
      ScoreboardFilters.test.tsx
      WinProbChart.test.tsx
      BoxScore.test.tsx
      DrivesSummary.test.tsx
```

---

## Task 1: Project Structure & Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.gitignore`
- Create: `api/Dockerfile`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Create `.gitignore`**

```
# Python
__pycache__/
*.pyc
.env
.venv/
*.egg-info/

# Node
node_modules/
.next/
.env.local

# Misc
.DS_Store
.superpowers/
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
version: "3.9"

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - API_INTERNAL_URL=http://api:8000
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - api
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - ./api:/app

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

- [ ] **Step 3: Create `api/Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 4: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .gitignore api/Dockerfile frontend/Dockerfile
git commit -m "chore: add project scaffolding and Docker config"
```

---

## Task 2: FastAPI App Skeleton + Healthcheck

**Files:**
- Create: `api/requirements.txt`
- Create: `api/pytest.ini`
- Create: `api/main.py`
- Create: `api/tests/conftest.py`
- Create: `api/tests/test_healthcheck.py`

- [ ] **Step 1: Create `api/requirements.txt`**

```
fastapi==0.115.5
uvicorn[standard]==0.32.0
httpx==0.27.2
redis==5.2.0
sportsdataverse==0.0.39
pytest==8.3.3
pytest-asyncio==0.23.8
```

- [ ] **Step 2: Create `api/pytest.ini`**

```ini
[pytest]
asyncio_mode = auto
```

- [ ] **Step 3: Write failing test — `api/tests/test_healthcheck.py`**

```python
import pytest
from httpx import AsyncClient


async def test_healthcheck(client: AsyncClient):
    response = await client.get("/healthcheck")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 4: Create `api/tests/conftest.py`**

```python
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
```

- [ ] **Step 5: Run test — expect FAIL (no main.py yet)**

```bash
cd api && pip install -r requirements.txt
pytest tests/test_healthcheck.py -v
```

Expected: `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 6: Create `api/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scoreboard, game

app = FastAPI(title="Game on Paper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(scoreboard.router)
app.include_router(game.router)


@app.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}
```

- [ ] **Step 7: Create `api/routers/__init__.py`** (empty file)

```bash
touch api/routers/__init__.py
```

- [ ] **Step 8: Create stub routers so `main.py` imports succeed**

Create `api/routers/scoreboard.py`:
```python
from fastapi import APIRouter

router = APIRouter()
```

Create `api/routers/game.py`:
```python
from fastapi import APIRouter

router = APIRouter()
```

- [ ] **Step 9: Run test — expect PASS**

```bash
pytest tests/test_healthcheck.py -v
```

Expected: `PASSED`

- [ ] **Step 10: Commit**

```bash
git add api/
git commit -m "feat: FastAPI skeleton with healthcheck endpoint"
```

---

## Task 3: Redis Cache Helper

**Files:**
- Create: `api/cache.py`
- Create: `api/tests/test_cache.py`

- [ ] **Step 1: Write failing tests — `api/tests/test_cache.py`**

```python
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pytest tests/test_cache.py -v
```

Expected: `ModuleNotFoundError: No module named 'cache'`

- [ ] **Step 3: Create `api/cache.py`**

```python
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pytest tests/test_cache.py -v
```

Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git add api/cache.py api/tests/test_cache.py
git commit -m "feat: Redis cache helper with get/set"
```

---

## Task 4: Scoreboard Router

**Files:**
- Modify: `api/routers/scoreboard.py`
- Create: `api/tests/test_scoreboard.py`

The scoreboard router fetches from ESPN's public API and computes an `excitement_level` for each game (gray/green/yellow/orange/red) based on score differential, period, and rankings.

ESPN scoreboard URL pattern:
- CFB: `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`
- NFL: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`

- [ ] **Step 1: Write failing tests — `api/tests/test_scoreboard.py`**

```python
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pytest tests/test_scoreboard.py -v
```

Expected: FAILED (no routes defined yet)

- [ ] **Step 3: Implement `api/routers/scoreboard.py`**

```python
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, Query

from cache import cache_get, cache_set

router = APIRouter()

ESPN_URLS = {
    "cfb": "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard",
    "nfl": "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
}


def compute_excitement_level(competition: dict) -> str:
    competitors = competition["competitors"]
    status = competition["status"]
    period = status.get("period", 0)
    is_late = period >= 4

    home = next(c for c in competitors if c["homeAway"] == "home")
    away = next(c for c in competitors if c["homeAway"] == "away")

    home_score = int(home.get("score", 0) or 0)
    away_score = int(away.get("score", 0) or 0)
    diff = abs(home_score - away_score)

    home_rank = home["team"].get("rank")
    away_rank = away["team"].get("rank")

    if not is_late:
        return "gray"

    if home_rank and away_rank and diff <= 8:
        return "orange"

    if diff <= 8:
        home_winning = home_score > away_score
        if away_rank and not home_rank and home_winning:
            return "yellow"
        if home_rank and not away_rank and not home_winning:
            return "yellow"
        return "green"

    return "gray"


def normalize_game(event: dict) -> dict:
    competition = event["competitions"][0]
    competitors = competition["competitors"]

    home = next(c for c in competitors if c["homeAway"] == "home")
    away = next(c for c in competitors if c["homeAway"] == "away")

    status_type = competition["status"]["type"]

    return {
        "id": event["id"],
        "start_time": event.get("date"),
        "status": status_type.get("name", ""),
        "status_completed": status_type.get("completed", False),
        "display_clock": competition["status"].get("displayClock", ""),
        "period": competition["status"].get("period", 0),
        "home_team": {
            "id": home["team"]["id"],
            "name": home["team"]["displayName"],
            "abbreviation": home["team"].get("abbreviation", ""),
            "logo": home["team"].get("logo", ""),
            "score": int(home.get("score", 0) or 0),
            "rank": home["team"].get("rank"),
        },
        "away_team": {
            "id": away["team"]["id"],
            "name": away["team"]["displayName"],
            "abbreviation": away["team"].get("abbreviation", ""),
            "logo": away["team"].get("logo", ""),
            "score": int(away.get("score", 0) or 0),
            "rank": away["team"].get("rank"),
        },
        "excitement_level": compute_excitement_level(competition),
    }


@router.get("/scoreboard/{sport}")
async def get_scoreboard(
    sport: str,
    year: str = Query(...),
    week: int = Query(...),
    group: str = Query("80"),
):
    if sport not in ESPN_URLS:
        raise HTTPException(status_code=404, detail=f"Unknown sport: {sport}")

    cache_key = f"scoreboard:{sport}:{year}:{week}:{group}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    params = {"seasontype": "2", "week": str(week), "groups": group, "limit": "200"}
    if year:
        params["season"] = year

    async with httpx.AsyncClient() as client:
        resp = await client.get(ESPN_URLS[sport], params=params)
        resp.raise_for_status()

    data = resp.json()
    result = {"games": [normalize_game(e) for e in data.get("events", [])]}

    cache_set(cache_key, result, ttl=10800)  # 3 hours
    return result
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pytest tests/test_scoreboard.py -v
```

Expected: 4 PASSED

- [ ] **Step 5: Commit**

```bash
git add api/routers/scoreboard.py api/tests/test_scoreboard.py
git commit -m "feat: scoreboard router with ESPN fetch and excitement_level"
```

---

## Task 5: Game Router

**Files:**
- Modify: `api/routers/game.py`
- Create: `api/tests/test_game.py`

The game router uses `sportsdataverse` to fetch and process ESPN play-by-play. It normalizes the response into a consistent shape and caches final games for 24h, in-progress games for 5 minutes.

- [ ] **Step 1: Write failing tests — `api/tests/test_game.py`**

```python
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pytest tests/test_game.py -v
```

Expected: FAILED

- [ ] **Step 3: Implement `api/routers/game.py`**

```python
from fastapi import APIRouter, HTTPException

from cache import cache_get, cache_set

router = APIRouter()

SUPPORTED_SPORTS = {"cfb", "nfl"}


def normalize_game_detail(pbp_json: dict) -> dict:
    header = pbp_json.get("header", {})
    competitions = header.get("competitions", [{}])
    competition = competitions[0] if competitions else {}
    competitors = competition.get("competitors", [])

    home = next((c for c in competitors if c["homeAway"] == "home"), {})
    away = next((c for c in competitors if c["homeAway"] == "away"), {})
    status = competition.get("status", {})
    status_type = status.get("type", {})

    plays_raw = pbp_json.get("plays", [])
    plays = [
        {
            "id": str(p.get("id", "")),
            "text": p.get("text", ""),
            "wallclock": p.get("wallclock", ""),
            "start": {
                "down": p.get("start", {}).get("down"),
                "distance": p.get("start", {}).get("distance"),
                "yards_to_endzone": p.get("start", {}).get("yardsToEndzone"),
            },
        }
        for p in plays_raw
    ]

    wp_raw = pbp_json.get("winProbability", [])
    win_probability = [
        {
            "play_id": str(wp.get("playId", "")),
            "home_wp": wp.get("homeWinPercentage"),
            "seconds_left": wp.get("secondsLeft"),
        }
        for wp in wp_raw
    ]

    drives_raw = pbp_json.get("drives", {}).get("previous", [])
    drives = [
        {
            "id": str(d.get("id", "")),
            "description": d.get("description", ""),
            "yards": d.get("yards", 0),
            "num_plays": d.get("plays", {}).get("number", 0),
            "start": d.get("start", {}).get("text", ""),
            "end": d.get("end", {}).get("text", ""),
            "result": d.get("result", ""),
        }
        for d in drives_raw
    ]

    return {
        "game_id": str(header.get("id", "")),
        "status": status_type.get("name", ""),
        "status_completed": status_type.get("completed", False),
        "period": status.get("period", 0),
        "display_clock": status.get("displayClock", ""),
        "home_team": {
            "id": home.get("team", {}).get("id", ""),
            "name": home.get("team", {}).get("displayName", ""),
            "abbreviation": home.get("team", {}).get("abbreviation", ""),
            "logo": home.get("team", {}).get("logo", ""),
            "score": int(home.get("score", 0) or 0),
        },
        "away_team": {
            "id": away.get("team", {}).get("id", ""),
            "name": away.get("team", {}).get("displayName", ""),
            "abbreviation": away.get("team", {}).get("abbreviation", ""),
            "logo": away.get("team", {}).get("logo", ""),
            "score": int(away.get("score", 0) or 0),
        },
        "plays": plays,
        "win_probability": win_probability,
        "box_score": pbp_json.get("boxScore", {}),
        "drives": drives,
    }


@router.get("/game/{sport}/{game_id}")
async def get_game(sport: str, game_id: str):
    if sport not in SUPPORTED_SPORTS:
        raise HTTPException(status_code=404, detail=f"Unknown sport: {sport}")

    cache_key = f"game:{sport}:{game_id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    if sport == "cfb":
        from sportsdataverse.cfb.cfb_pbp import CFBPlayProcess
        process = CFBPlayProcess(gameId=int(game_id))
        process.espn_cfb_pbp()
        process.run_processing_pipeline()
        pbp_json = process.json
    else:
        from sportsdataverse.nfl.nfl_pbp import NFLPlayProcess
        process = NFLPlayProcess(gameId=int(game_id))
        process.espn_nfl_pbp()
        process.run_processing_pipeline()
        pbp_json = process.json

    result = normalize_game_detail(pbp_json)

    ttl = 86400 if result["status_completed"] else 300
    cache_set(cache_key, result, ttl=ttl)
    return result
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pytest tests/test_game.py -v
```

Expected: 4 PASSED

- [ ] **Step 5: Run full test suite**

```bash
pytest -v
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add api/routers/game.py api/tests/test_game.py
git commit -m "feat: game detail router with sportsdataverse and smart caching"
```

---

## Task 6: Next.js App Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/jest.config.ts`
- Create: `frontend/jest.setup.ts`
- Create: `frontend/app/globals.css`
- Create: `frontend/app/layout.tsx`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "game-on-paper-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest --watchAll=false",
    "test:watch": "jest"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "recharts": "2.13.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/node": "22.10.0",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.1",
    "autoprefixer": "10.4.20",
    "jest": "29.7.0",
    "jest-environment-jsdom": "29.7.0",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.16",
    "ts-jest": "29.2.5",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `frontend/next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "a1.espncdn.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create `frontend/tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Create `frontend/postcss.config.js`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `frontend/jest.config.ts`**

```typescript
import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react" } }],
  },
};

export default config;
```

- [ ] **Step 7: Create `frontend/jest.setup.ts`**

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 8: Create `frontend/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create `frontend/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game on Paper",
  description: "College football and NFL game analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex gap-6 items-center">
            <span className="font-bold text-white text-lg">Game on Paper</span>
            <a href="/cfb" className="text-gray-300 hover:text-white text-sm">CFB</a>
            <a href="/nfl" className="text-gray-300 hover:text-white text-sm">NFL</a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Install dependencies**

```bash
cd frontend && npm install
```

- [ ] **Step 11: Commit**

```bash
git add frontend/
git commit -m "chore: Next.js 15 app scaffolding with Tailwind and Jest"
```

---

## Task 7: TypeScript Types & API Client

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`
- Create: `frontend/__tests__/api.test.ts`

- [ ] **Step 1: Create `frontend/lib/types.ts`**

```typescript
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  score: number;
  rank?: number | null;
}

export interface Game {
  id: string;
  start_time: string;
  status: string;
  status_completed: boolean;
  display_clock: string;
  period: number;
  home_team: Team;
  away_team: Team;
  excitement_level: "gray" | "green" | "yellow" | "orange" | "red";
}

export interface ScoreboardResponse {
  games: Game[];
}

export interface Play {
  id: string;
  text: string;
  wallclock: string;
  start: {
    down: number | null;
    distance: number | null;
    yards_to_endzone: number | null;
  };
}

export interface WinProbabilityPoint {
  play_id: string;
  home_wp: number;
  seconds_left: number;
}

export interface Drive {
  id: string;
  description: string;
  yards: number;
  num_plays: number;
  start: string;
  end: string;
  result: string;
}

export interface GameDetail {
  game_id: string;
  status: string;
  status_completed: boolean;
  period: number;
  display_clock: string;
  home_team: Omit<Team, "rank">;
  away_team: Omit<Team, "rank">;
  plays: Play[];
  win_probability: WinProbabilityPoint[];
  box_score: Record<string, unknown>;
  drives: Drive[];
}
```

- [ ] **Step 2: Write failing tests — `frontend/__tests__/api.test.ts`**

```typescript
import { fetchScoreboard, fetchGame } from "@/lib/api";

const MOCK_SCOREBOARD = {
  games: [{ id: "401628444", home_team: { name: "Alabama" } }],
};

const MOCK_GAME = { game_id: "401628444", status: "STATUS_FINAL" };

describe("fetchScoreboard", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("calls the correct URL and returns games", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SCOREBOARD,
    });

    const result = await fetchScoreboard("cfb", "2025", 1);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/scoreboard/cfb"),
      expect.any(Object)
    );
    expect(result.games[0].id).toBe("401628444");
  });

  it("throws on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchScoreboard("cfb", "2025", 1)).rejects.toThrow("500");
  });
});

describe("fetchGame", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("calls the correct URL and returns game detail", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_GAME,
    });

    const result = await fetchGame("cfb", "401628444");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/game/cfb/401628444"),
      expect.any(Object)
    );
    expect(result.game_id).toBe("401628444");
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd frontend && npm test -- __tests__/api.test.ts
```

Expected: FAILED (no api.ts yet)

- [ ] **Step 4: Create `frontend/lib/api.ts`**

```typescript
import type { ScoreboardResponse, GameDetail } from "./types";

const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export function fetchScoreboard(
  sport: string,
  year: string,
  week: number,
  group = "80"
): Promise<ScoreboardResponse> {
  return apiFetch<ScoreboardResponse>(`/scoreboard/${sport}`, {
    year,
    week: String(week),
    group,
  });
}

export function fetchGame(sport: string, gameId: string): Promise<GameDetail> {
  return apiFetch<GameDetail>(`/game/${sport}/${gameId}`);
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- __tests__/api.test.ts
```

Expected: all PASSED

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/
git commit -m "feat: typed API client and shared TypeScript types"
```

---

## Task 8: Root Redirect Page

**Files:**
- Create: `frontend/app/page.tsx`

- [ ] **Step 1: Create `frontend/app/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/cfb");
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: redirect root to /cfb"
```

---

## Task 9: GameCard Component

**Files:**
- Create: `frontend/components/GameCard.tsx`
- Create: `frontend/__tests__/GameCard.test.tsx`

- [ ] **Step 1: Write failing tests — `frontend/__tests__/GameCard.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import GameCard from "@/components/GameCard";
import type { Game } from "@/lib/types";

const GAME: Game = {
  id: "401628444",
  start_time: "2025-09-06T18:00:00Z",
  status: "STATUS_FINAL",
  status_completed: true,
  display_clock: "0:00",
  period: 4,
  home_team: {
    id: "333",
    name: "Alabama Crimson Tide",
    abbreviation: "ALA",
    logo: "https://a.espncdn.com/i/teamlogos/cfb/500/333.png",
    score: 34,
    rank: 1,
  },
  away_team: {
    id: "61",
    name: "Georgia Bulldogs",
    abbreviation: "UGA",
    logo: "https://a.espncdn.com/i/teamlogos/cfb/500/61.png",
    score: 20,
    rank: null,
  },
  excitement_level: "green",
};

describe("GameCard", () => {
  it("renders both team names", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    expect(screen.getByText("Alabama Crimson Tide")).toBeInTheDocument();
    expect(screen.getByText("Georgia Bulldogs")).toBeInTheDocument();
  });

  it("renders scores", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders home team rank", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("renders a link to the game detail page", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/cfb/game/401628444");
  });

  it("applies excitement_level border color", () => {
    const { container } = render(<GameCard game={GAME} sport="cfb" />);
    expect(container.firstChild).toHaveClass("border-green-500");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- __tests__/GameCard.test.tsx
```

Expected: FAILED

- [ ] **Step 3: Create `frontend/components/GameCard.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import type { Game } from "@/lib/types";

const EXCITEMENT_BORDER: Record<Game["excitement_level"], string> = {
  gray: "border-gray-700",
  green: "border-green-500",
  yellow: "border-yellow-400",
  orange: "border-orange-400",
  red: "border-red-500",
};

function TeamRow({ team }: { team: Game["home_team"] }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={team.logo}
        alt={team.name}
        width={28}
        height={28}
        className="rounded"
      />
      <span className="flex-1 text-sm font-medium">
        {team.rank && (
          <span className="text-gray-400 text-xs mr-1">#{team.rank}</span>
        )}
        {team.name}
      </span>
      <span className="text-sm font-bold tabular-nums">{team.score}</span>
    </div>
  );
}

export default function GameCard({
  game,
  sport,
}: {
  game: Game;
  sport: string;
}) {
  const borderClass = EXCITEMENT_BORDER[game.excitement_level];

  return (
    <Link href={`/${sport}/game/${game.id}`}>
      <div
        className={`bg-gray-900 border-l-4 ${borderClass} rounded p-3 hover:bg-gray-800 transition-colors`}
      >
        <TeamRow team={game.away_team} />
        <TeamRow team={game.home_team} />
        <div className="text-xs text-gray-500 mt-1">
          {game.status_completed
            ? "Final"
            : `Q${game.period} ${game.display_clock}`}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- __tests__/GameCard.test.tsx
```

Expected: 5 PASSED

- [ ] **Step 5: Commit**

```bash
git add frontend/components/GameCard.tsx frontend/__tests__/GameCard.test.tsx
git commit -m "feat: GameCard component with excitement level border"
```

---

## Task 10: ScoreboardFilters Component

**Files:**
- Create: `frontend/components/ScoreboardFilters.tsx`
- Create: `frontend/__tests__/ScoreboardFilters.test.tsx`

This is a client component. It reads current filter values from URL search params and updates them on change, triggering a full page re-fetch.

- [ ] **Step 1: Write failing tests — `frontend/__tests__/ScoreboardFilters.test.tsx`**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import ScoreboardFilters from "@/components/ScoreboardFilters";

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("year=2025&week=1&group=80"),
  usePathname: () => "/cfb",
}));

describe("ScoreboardFilters", () => {
  beforeEach(() => mockReplace.mockClear());

  it("renders year, week, and group selects", () => {
    render(<ScoreboardFilters sport="cfb" />);
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByLabelText("Group")).toBeInTheDocument();
  });

  it("shows current year as selected", () => {
    render(<ScoreboardFilters sport="cfb" />);
    const yearSelect = screen.getByLabelText("Year") as HTMLSelectElement;
    expect(yearSelect.value).toBe("2025");
  });

  it("calls router.replace on year change", () => {
    render(<ScoreboardFilters sport="cfb" />);
    const yearSelect = screen.getByLabelText("Year");
    fireEvent.change(yearSelect, { target: { value: "2024" } });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("year=2024")
    );
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- __tests__/ScoreboardFilters.test.tsx
```

Expected: FAILED

- [ ] **Step 3: Create `frontend/components/ScoreboardFilters.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const YEARS = Array.from({ length: 24 }, (_, i) => String(2025 - i));
const WEEKS = Array.from({ length: 18 }, (_, i) => String(i + 1));
const CFB_GROUPS = [
  { label: "All FBS", value: "80" },
  { label: "ACC", value: "1" },
  { label: "Big Ten", value: "5" },
  { label: "Big 12", value: "4" },
  { label: "SEC", value: "8" },
  { label: "Pac-12", value: "9" },
];
const NFL_GROUPS = [{ label: "All", value: "0" }];

export default function ScoreboardFilters({ sport }: { sport: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const year = searchParams.get("year") ?? String(new Date().getFullYear());
  const week = searchParams.get("week") ?? "1";
  const group = searchParams.get("group") ?? "80";

  const groups = sport === "nfl" ? NFL_GROUPS : CFB_GROUPS;

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-4 items-end flex-wrap mb-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="year-select" className="text-xs text-gray-400 uppercase">Year</label>
        <select
          id="year-select"
          aria-label="Year"
          value={year}
          onChange={(e) => update("year", e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="week-select" className="text-xs text-gray-400 uppercase">Week</label>
        <select
          id="week-select"
          aria-label="Week"
          value={week}
          onChange={(e) => update("week", e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
        >
          {WEEKS.map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="group-select" className="text-xs text-gray-400 uppercase">Group</label>
        <select
          id="group-select"
          aria-label="Group"
          value={group}
          onChange={(e) => update("group", e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
        >
          {groups.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- __tests__/ScoreboardFilters.test.tsx
```

Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ScoreboardFilters.tsx frontend/__tests__/ScoreboardFilters.test.tsx
git commit -m "feat: ScoreboardFilters client component with URL param sync"
```

---

## Task 11: Scoreboard Page

**Files:**
- Create: `frontend/app/[sport]/page.tsx`

- [ ] **Step 1: Create `frontend/app/[sport]/page.tsx`**

```tsx
import { Suspense } from "react";
import { fetchScoreboard } from "@/lib/api";
import GameCard from "@/components/GameCard";
import ScoreboardFilters from "@/components/ScoreboardFilters";

interface Props {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ year?: string; week?: string; group?: string }>;
}

export default async function ScoreboardPage({ params, searchParams }: Props) {
  const { sport } = await params;
  const { year, week, group } = await searchParams;

  const currentYear = String(new Date().getFullYear());
  const resolvedYear = year ?? currentYear;
  const resolvedWeek = parseInt(week ?? "1", 10);
  const resolvedGroup = group ?? "80";

  const { games } = await fetchScoreboard(
    sport,
    resolvedYear,
    resolvedWeek,
    resolvedGroup
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 uppercase text-gray-200">
        {sport.toUpperCase()} Scoreboard
      </h1>

      <Suspense>
        <ScoreboardFilters sport={sport} />
      </Suspense>

      {games.length === 0 ? (
        <p className="text-gray-500">No games found for this week.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} sport={sport} />
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-gray-600">
        Data sourced from ESPN. Color guide: gray = normal, green = close game
        late, yellow = ranked upset, orange = ranked teams close, red = FCS upset.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/[sport]/page.tsx
git commit -m "feat: scoreboard page with server-side data fetching"
```

---

## Task 12: WinProbChart Component

**Files:**
- Create: `frontend/components/WinProbChart.tsx`
- Create: `frontend/__tests__/WinProbChart.test.tsx`

- [ ] **Step 1: Write failing tests — `frontend/__tests__/WinProbChart.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import WinProbChart from "@/components/WinProbChart";
import type { WinProbabilityPoint } from "@/lib/types";

// Recharts uses ResizeObserver — mock it
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const WP_DATA: WinProbabilityPoint[] = [
  { play_id: "1", home_wp: 0.55, seconds_left: 3600 },
  { play_id: "2", home_wp: 0.62, seconds_left: 3000 },
  { play_id: "3", home_wp: 0.41, seconds_left: 1800 },
];

describe("WinProbChart", () => {
  it("renders without crashing", () => {
    render(
      <WinProbChart
        data={WP_DATA}
        homeTeam="Alabama"
        awayTeam="Georgia"
      />
    );
  });

  it("renders team names in legend", () => {
    render(
      <WinProbChart
        data={WP_DATA}
        homeTeam="Alabama"
        awayTeam="Georgia"
      />
    );
    expect(screen.getByText("Alabama (home)")).toBeInTheDocument();
  });

  it("renders nothing when data is empty", () => {
    const { container } = render(
      <WinProbChart data={[]} homeTeam="Alabama" awayTeam="Georgia" />
    );
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- __tests__/WinProbChart.test.tsx
```

Expected: FAILED

- [ ] **Step 3: Create `frontend/components/WinProbChart.tsx`**

```tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { WinProbabilityPoint } from "@/lib/types";

interface Props {
  data: WinProbabilityPoint[];
  homeTeam: string;
  awayTeam: string;
}

export default function WinProbChart({ data, homeTeam, awayTeam }: Props) {
  if (data.length === 0) return null;

  const chartData = data.map((d, i) => ({
    index: i,
    home_wp: Math.round(d.home_wp * 100),
    away_wp: Math.round((1 - d.home_wp) * 100),
  }));

  return (
    <div className="bg-gray-900 rounded p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">
        Win Probability
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="index" hide />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
          <Legend
            formatter={(value) =>
              value === "home_wp" ? `${homeTeam} (home)` : `${awayTeam} (away)`
            }
          />
          <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="4 2" />
          <Line type="monotone" dataKey="home_wp" stroke="#3b82f6" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="away_wp" stroke="#ef4444" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- __tests__/WinProbChart.test.tsx
```

Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git add frontend/components/WinProbChart.tsx frontend/__tests__/WinProbChart.test.tsx
git commit -m "feat: WinProbChart with Recharts line chart"
```

---

## Task 13: BoxScore Component

**Files:**
- Create: `frontend/components/BoxScore.tsx`
- Create: `frontend/__tests__/BoxScore.test.tsx`

- [ ] **Step 1: Write failing tests — `frontend/__tests__/BoxScore.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import BoxScore from "@/components/BoxScore";

const BOX_SCORE = {
  teams: [
    {
      homeAway: "home",
      team: { displayName: "Alabama Crimson Tide" },
      statistics: [
        { name: "totalYards", displayValue: "412", label: "Total Yards" },
        { name: "netPassingYards", displayValue: "298", label: "Passing Yards" },
        { name: "rushingYards", displayValue: "114", label: "Rushing Yards" },
      ],
    },
    {
      homeAway: "away",
      team: { displayName: "Georgia Bulldogs" },
      statistics: [
        { name: "totalYards", displayValue: "310", label: "Total Yards" },
        { name: "netPassingYards", displayValue: "201", label: "Passing Yards" },
        { name: "rushingYards", displayValue: "109", label: "Rushing Yards" },
      ],
    },
  ],
};

describe("BoxScore", () => {
  it("renders both team names", () => {
    render(<BoxScore boxScore={BOX_SCORE} />);
    expect(screen.getByText("Alabama Crimson Tide")).toBeInTheDocument();
    expect(screen.getByText("Georgia Bulldogs")).toBeInTheDocument();
  });

  it("renders stat labels", () => {
    render(<BoxScore boxScore={BOX_SCORE} />);
    expect(screen.getByText("Total Yards")).toBeInTheDocument();
    expect(screen.getByText("Passing Yards")).toBeInTheDocument();
  });

  it("renders stat values", () => {
    render(<BoxScore boxScore={BOX_SCORE} />);
    expect(screen.getByText("412")).toBeInTheDocument();
    expect(screen.getByText("310")).toBeInTheDocument();
  });

  it("renders nothing when boxScore has no teams", () => {
    const { container } = render(<BoxScore boxScore={{}} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- __tests__/BoxScore.test.tsx
```

Expected: FAILED

- [ ] **Step 3: Create `frontend/components/BoxScore.tsx`**

```tsx
interface StatEntry {
  name: string;
  displayValue: string;
  label: string;
}

interface TeamStats {
  homeAway: string;
  team: { displayName: string };
  statistics: StatEntry[];
}

interface Props {
  boxScore: { teams?: TeamStats[] };
}

const DISPLAY_STATS = [
  "totalYards",
  "netPassingYards",
  "rushingYards",
  "turnovers",
  "firstDowns",
  "thirdDownEff",
];

export default function BoxScore({ boxScore }: Props) {
  const teams = boxScore?.teams;
  if (!teams || teams.length < 2) return null;

  const home = teams.find((t) => t.homeAway === "home") ?? teams[0];
  const away = teams.find((t) => t.homeAway === "away") ?? teams[1];

  const homeStats = Object.fromEntries(
    home.statistics.map((s) => [s.name, s])
  );
  const awayStats = Object.fromEntries(
    away.statistics.map((s) => [s.name, s])
  );

  const rows = DISPLAY_STATS
    .filter((key) => homeStats[key] || awayStats[key])
    .map((key) => ({
      label: homeStats[key]?.label ?? awayStats[key]?.label ?? key,
      home: homeStats[key]?.displayValue ?? "—",
      away: awayStats[key]?.displayValue ?? "—",
    }));

  return (
    <div className="bg-gray-900 rounded p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">Box Score</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs">
            <th className="text-left py-1 font-normal"></th>
            <th className="text-right py-1 font-normal">{away.team.displayName}</th>
            <th className="text-right py-1 font-normal">{home.team.displayName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-gray-800">
              <td className="py-1.5 text-gray-400">{row.label}</td>
              <td className="py-1.5 text-right tabular-nums">{row.away}</td>
              <td className="py-1.5 text-right tabular-nums">{row.home}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- __tests__/BoxScore.test.tsx
```

Expected: 4 PASSED

- [ ] **Step 5: Commit**

```bash
git add frontend/components/BoxScore.tsx frontend/__tests__/BoxScore.test.tsx
git commit -m "feat: BoxScore component with team stats table"
```

---

## Task 14: DrivesSummary Component

**Files:**
- Create: `frontend/components/DrivesSummary.tsx`
- Create: `frontend/__tests__/DrivesSummary.test.tsx`

- [ ] **Step 1: Write failing tests — `frontend/__tests__/DrivesSummary.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import DrivesSummary from "@/components/DrivesSummary";
import type { Drive } from "@/lib/types";

const DRIVES: Drive[] = [
  {
    id: "1",
    description: "Touchdown Drive",
    yards: 75,
    num_plays: 8,
    start: "OWN 25",
    end: "OPP 0",
    result: "TD",
  },
  {
    id: "2",
    description: "Punt",
    yards: 12,
    num_plays: 3,
    start: "OWN 30",
    end: "OWN 42",
    result: "PUNT",
  },
];

describe("DrivesSummary", () => {
  it("renders drive results", () => {
    render(<DrivesSummary drives={DRIVES} />);
    expect(screen.getByText("TD")).toBeInTheDocument();
    expect(screen.getByText("PUNT")).toBeInTheDocument();
  });

  it("renders yards for each drive", () => {
    render(<DrivesSummary drives={DRIVES} />);
    expect(screen.getByText("75 yds")).toBeInTheDocument();
    expect(screen.getByText("12 yds")).toBeInTheDocument();
  });

  it("renders number of plays", () => {
    render(<DrivesSummary drives={DRIVES} />);
    expect(screen.getByText("8 plays")).toBeInTheDocument();
  });

  it("renders nothing when drives is empty", () => {
    const { container } = render(<DrivesSummary drives={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- __tests__/DrivesSummary.test.tsx
```

Expected: FAILED

- [ ] **Step 3: Create `frontend/components/DrivesSummary.tsx`**

```tsx
import type { Drive } from "@/lib/types";

const RESULT_COLORS: Record<string, string> = {
  TD: "text-green-400",
  FG: "text-blue-400",
  PUNT: "text-gray-400",
  INT: "text-red-400",
  FUMBLE: "text-red-400",
  "MISSED FG": "text-yellow-400",
  DOWNS: "text-orange-400",
};

export default function DrivesSummary({ drives }: { drives: Drive[] }) {
  if (drives.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">Drives</h2>
      <div className="space-y-1">
        {drives.map((drive) => (
          <div
            key={drive.id}
            className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-800 last:border-0"
          >
            <span
              className={`w-16 font-bold text-xs ${RESULT_COLORS[drive.result] ?? "text-gray-300"}`}
            >
              {drive.result}
            </span>
            <span className="flex-1 text-gray-300 text-xs truncate">
              {drive.start} → {drive.end}
            </span>
            <span className="text-gray-400 text-xs tabular-nums">{drive.yards} yds</span>
            <span className="text-gray-500 text-xs tabular-nums">{drive.num_plays} plays</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- __tests__/DrivesSummary.test.tsx
```

Expected: 4 PASSED

- [ ] **Step 5: Commit**

```bash
git add frontend/components/DrivesSummary.tsx frontend/__tests__/DrivesSummary.test.tsx
git commit -m "feat: DrivesSummary component with result color coding"
```

---

## Task 15: Game Detail Page

**Files:**
- Create: `frontend/app/[sport]/game/[id]/page.tsx`

- [ ] **Step 1: Create `frontend/app/[sport]/game/[id]/page.tsx`**

```tsx
import { fetchGame } from "@/lib/api";
import WinProbChart from "@/components/WinProbChart";
import BoxScore from "@/components/BoxScore";
import DrivesSummary from "@/components/DrivesSummary";
import Image from "next/image";

interface Props {
  params: Promise<{ sport: string; id: string }>;
}

export default async function GameDetailPage({ params }: Props) {
  const { sport, id } = await params;
  const game = await fetchGame(sport, id);

  const isPregame =
    game.status === "STATUS_SCHEDULED" || game.status === "STATUS_PREGAME";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded p-4">
        <div className="flex items-center justify-center gap-8">
          <TeamScore team={game.away_team} />
          <div className="text-center">
            <div className="text-gray-400 text-sm">
              {game.status_completed
                ? "Final"
                : isPregame
                ? "Scheduled"
                : `Q${game.period} ${game.display_clock}`}
            </div>
            <div className="text-3xl font-bold mt-1">
              {game.away_team.score} – {game.home_team.score}
            </div>
          </div>
          <TeamScore team={game.home_team} />
        </div>
      </div>

      {isPregame ? (
        <p className="text-center text-gray-400">
          Game has not started yet.
        </p>
      ) : (
        <>
          {game.win_probability.length > 0 && (
            <WinProbChart
              data={game.win_probability}
              homeTeam={game.home_team.name}
              awayTeam={game.away_team.name}
            />
          )}

          <BoxScore boxScore={game.box_score} />

          <DrivesSummary drives={game.drives} />

          {game.plays.length > 0 && (
            <div className="bg-gray-900 rounded p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                Play by Play
              </h2>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {[...game.plays].reverse().map((play) => (
                  <div
                    key={play.id}
                    className="text-sm py-1.5 border-b border-gray-800 last:border-0"
                  >
                    <span className="text-gray-400 text-xs mr-2">
                      {play.start.down
                        ? `${play.start.down}&${play.start.distance}`
                        : ""}
                    </span>
                    <span className="text-gray-200">{play.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeamScore({
  team,
}: {
  team: { name: string; logo: string; score: number };
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-24">
      <Image
        src={team.logo}
        alt={team.name}
        width={48}
        height={48}
        className="rounded"
      />
      <span className="text-sm text-center text-gray-300 leading-tight">
        {team.name}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Run all frontend tests**

```bash
cd frontend && npm test
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/app/[sport]/game/
git commit -m "feat: game detail page with WP chart, box score, drives, and PBP"
```

---

## Task 16: Smoke Test — Local Docker Dev

- [ ] **Step 1: Build and start all services**

```bash
docker compose up --build
```

Expected: three containers start — `frontend`, `api`, `redis`. No crash loops.

- [ ] **Step 2: Verify healthcheck**

```bash
curl http://localhost:8000/healthcheck
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Verify scoreboard page loads**

Open `http://localhost:3000/cfb` in browser.

Expected: page loads, shows scoreboard filters, game cards appear (or "No games found" if off-season).

- [ ] **Step 4: Verify game detail page loads**

From the scoreboard, click any game card.

Expected: game detail page loads with score header. If game is final, win probability chart and box score appear.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: smoke test passed — MVP local dev working"
```
