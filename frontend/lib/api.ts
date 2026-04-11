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
