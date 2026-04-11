# Game on Paper — Design Spec

**Date:** 2026-04-11
**Scope:** MVP — scoreboard + game detail pages
**Reference:** https://gameonpaper.com / https://github.com/saiemgilani/game-on-paper-app

---

## Overview

A web app that replicates the core functionality of gameonpaper.com: a filterable game scoreboard and a per-game detail view with play-by-play data, win probability chart, box score, and drives. Built sport-agnostically to support CFB and NFL from day one, with room to add more sports later.

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js (React, TypeScript) + Tailwind CSS | Vercel (production) / localhost:3000 (dev) |
| API | Python FastAPI | Render (production) / localhost:8000 (dev) |
| Cache | Redis | Render managed Redis (production) / Docker (dev) |
| Data | ESPN via `sportsdataverse` Python library | — |
| Orchestration | Docker Compose | Local dev only |

---

## Architecture

```
Browser → Next.js (Vercel) → FastAPI (Render) → ESPN via sportsdataverse
                                    ↕
                               Redis cache
```

- Next.js server components call FastAPI directly (server-to-server, no CORS in production)
- FastAPI is a pure data layer — fetches, processes, caches, and returns JSON
- Redis caches responses to avoid hammering ESPN on every request
- Docker Compose wires all three services locally; Next.js uses `http://api:8000` inside Docker

---

## Repo Structure

```
game_on_paper/
  frontend/                  # Next.js application
    app/
      page.tsx               # Redirects to /cfb
      [sport]/
        page.tsx             # Scoreboard page
        game/
          [id]/
            page.tsx         # Game detail page
    components/
      ScoreboardFilters.tsx  # Year/week/conference filter bar
      GameCard.tsx           # Single game row/card on scoreboard
      WinProbChart.tsx       # Win probability line chart
      BoxScore.tsx           # Team/player box score table
      DrivesSummary.tsx      # Drive-by-drive breakdown
    lib/
      api.ts                 # FastAPI client (fetch wrapper)
    tailwind.config.ts
    next.config.ts
  api/                       # FastAPI application
    main.py                  # App entry point, CORS, middleware
    routers/
      scoreboard.py          # GET /scoreboard/{sport}
      game.py                # GET /game/{sport}/{id}
    cache.py                 # Redis get/set helpers
    requirements.txt
    Dockerfile
  docker-compose.yml         # Local dev: frontend + api + redis
  README.md
```

---

## Pages

### `/` → redirect to `/cfb`

### `/[sport]` — Scoreboard

Displays a list of games for the selected sport, filterable by year, week, and conference/group.

- **Sport param:** `cfb` or `nfl` (extensible — adding a new sport only requires a new FastAPI router)
- **Filters:** year selector, week selector (dynamic based on year), conference/division filter
- **Game cards:** team logos, team names, game time, game status, link to game detail
- **Color coding:** `excitement_level` field returned by FastAPI (computed server-side from score differential, time remaining, and ranking data). Values: `gray` (normal), `green` (close game late), `yellow` (ranked upset), `orange` (ranked close game), `red` (FCS upset). Frontend just maps value to a CSS class.
- **Data:** fetched server-side in Next.js via FastAPI, statically rendered with client-side filter updates via URL params

### `/[sport]/game/[id]` — Game Detail

Full game breakdown for a single ESPN game ID.

- **Header:** team names, logos, score, game status/time
- **Win Probability Chart:** line chart showing home team WP over the course of the game (Recharts)
- **Box Score:** team stats table + player stats by position group
- **Drives:** drive-by-drive summary (start position, result, yards, plays)
- **Play-by-Play:** scrollable list of plays with down/distance, description, WP delta
- **Pregame state:** if game hasn't started, show matchup info and scheduled time

---

## FastAPI Endpoints

### `GET /scoreboard/{sport}?year=&week=&group=`

Returns a list of games for the given sport/year/week/group.

**Response:**
```json
{
  "games": [
    {
      "id": "401628444",
      "home_team": { "name": "Alabama", "logo": "...", "score": 34 },
      "away_team": { "name": "Georgia", "logo": "...", "score": 28 },
      "status": "final",
      "start_time": "2025-09-06T18:00:00Z",
      "excitement_level": "green"  // computed by API: gray|green|yellow|orange|red
    }
  ]
}
```

**Cache TTL:** 3 hours

### `GET /game/{sport}/{id}`

Returns full game data for a single ESPN game ID.

**Response:**
```json
{
  "game_id": "401628444",
  "status": "final",
  "home_team": { ... },
  "away_team": { ... },
  "win_probability": [ { "play_id": 1, "home_wp": 0.62, "elapsed": 120 } ],
  "box_score": { ... },
  "drives": [ ... ],
  "plays": [ ... ]
}
```

**Cache TTL:** 5 minutes (in-progress games), 24 hours (final games)

### `GET /healthcheck`

Returns `{"status": "ok"}`.

---

## Data Layer

- `sportsdataverse` Python library handles ESPN API calls and play-by-play processing
- CFB: `sportsdataverse.cfb` — `CFBPlayProcess` class (same as original)
- NFL: `sportsdataverse.nfl` — equivalent NFL play processor
- Adding a new sport = new router file + sportsdataverse module, no changes to shared infrastructure

---

## Local Development

```bash
docker compose up
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Redis: localhost:6379

Environment variables:
- `NEXT_PUBLIC_API_URL` — set to `http://localhost:8000` in dev, Render URL in production
- `REDIS_URL` — set automatically in Docker Compose

---

## Out of Scope (MVP)

- Team leaderboards
- Player leaderboards
- EPA differential chart
- Historical trends
- Glossary page
- Authentication
- User accounts / saved games
