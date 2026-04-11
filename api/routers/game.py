from fastapi import APIRouter, HTTPException
from cache import cache_get, cache_set

# Module-level imports so tests can patch routers.game.CFBPlayProcess
try:
    from sportsdataverse.cfb.cfb_pbp import CFBPlayProcess
    from sportsdataverse.nfl.nfl_pbp import NFLPlayProcess
except Exception:
    CFBPlayProcess = None  # type: ignore
    NFLPlayProcess = None  # type: ignore

router = APIRouter(prefix="/game", tags=["game"])

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


@router.get("/{sport}/{game_id}")
async def get_game(sport: str, game_id: str):
    if sport not in SUPPORTED_SPORTS:
        raise HTTPException(status_code=404, detail=f"Unknown sport: {sport}")

    cache_key = f"game:{sport}:{game_id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    if sport == "cfb":
        process = CFBPlayProcess(gameId=int(game_id))
        process.espn_cfb_pbp()
        process.run_processing_pipeline()
        pbp_json = process.json
    else:
        process = NFLPlayProcess(gameId=int(game_id))
        process.espn_nfl_pbp()
        process.run_processing_pipeline()
        pbp_json = process.json

    result = normalize_game_detail(pbp_json)

    ttl = 86400 if result["status_completed"] else 300
    cache_set(cache_key, result, ttl)
    return result
