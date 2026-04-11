import React from "react";

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
