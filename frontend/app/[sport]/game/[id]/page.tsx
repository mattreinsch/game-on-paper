import React from "react";
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
