"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { WinProbabilityPoint } from "@/lib/types";

interface Props {
  data: WinProbabilityPoint[];
  homeTeam: string;
  awayTeam: string;
}

export default function WinProbChart({ data, homeTeam, awayTeam }: Props) {
  if (data.length === 0) return null;

  const chartData = data.map((d, i) => ({
    index: i,
    home_wp: Math.round(d.home_wp * 100),
    away_wp: Math.round((1 - d.home_wp) * 100),
  }));

  return (
    <div className="bg-gray-900 rounded p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">
        Win Probability
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="index" hide />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
          <Legend
            formatter={(value) =>
              value === "home_wp" ? `${homeTeam} (home)` : `${awayTeam} (away)`
            }
          />
          <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="4 2" />
          <Line type="monotone" dataKey="home_wp" stroke="#3b82f6" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="away_wp" stroke="#ef4444" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
