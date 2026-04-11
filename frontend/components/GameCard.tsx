import React from "react";
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
