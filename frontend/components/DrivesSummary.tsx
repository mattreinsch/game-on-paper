import React from "react";
import type { Drive } from "@/lib/types";

const RESULT_COLORS: Record<string, string> = {
  TD: "text-green-400",
  FG: "text-blue-400",
  PUNT: "text-gray-400",
  INT: "text-red-400",
  FUMBLE: "text-red-400",
  "MISSED FG": "text-yellow-400",
  DOWNS: "text-orange-400",
};

export default function DrivesSummary({ drives }: { drives: Drive[] }) {
  if (drives.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">Drives</h2>
      <div className="space-y-1">
        {drives.map((drive) => (
          <div
            key={drive.id}
            className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-800 last:border-0"
          >
            <span
              className={`w-16 font-bold text-xs ${RESULT_COLORS[drive.result] ?? "text-gray-300"}`}
            >
              {drive.result}
            </span>
            <span className="flex-1 text-gray-300 text-xs truncate">
              {drive.start} → {drive.end}
            </span>
            <span className="text-gray-400 text-xs tabular-nums">{drive.yards} yds</span>
            <span className="text-gray-500 text-xs tabular-nums">{drive.num_plays} plays</span>
          </div>
        ))}
      </div>
    </div>
  );
}
