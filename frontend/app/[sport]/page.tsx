import React from "react";
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
