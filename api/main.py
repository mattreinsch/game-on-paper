from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scoreboard, game

app = FastAPI(title="Game on Paper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scoreboard.router)
app.include_router(game.router)


@app.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}
