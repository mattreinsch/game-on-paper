"use client";

import React from "react";
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
