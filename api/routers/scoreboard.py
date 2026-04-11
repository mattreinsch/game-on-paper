from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, Query

from cache import cache_get, cache_set

router = APIRouter(prefix="/scoreboard", tags=["scoreboard"])

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


@router.get("/{sport}")
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
