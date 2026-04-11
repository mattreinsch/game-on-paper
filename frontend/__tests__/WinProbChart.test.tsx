import React from "react";
import { render, screen } from "@testing-library/react";
import WinProbChart from "@/components/WinProbChart";
import type { WinProbabilityPoint } from "@/lib/types";

// Recharts uses ResizeObserver — mock it
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const WP_DATA: WinProbabilityPoint[] = [
  { play_id: "1", home_wp: 0.55, seconds_left: 3600 },
  { play_id: "2", home_wp: 0.62, seconds_left: 3000 },
  { play_id: "3", home_wp: 0.41, seconds_left: 1800 },
];

describe("WinProbChart", () => {
  it("renders without crashing", () => {
    render(
      <WinProbChart
        data={WP_DATA}
        homeTeam="Alabama"
        awayTeam="Georgia"
      />
    );
  });

  it("renders team name in legend", () => {
    render(
      <WinProbChart
        data={WP_DATA}
        homeTeam="Alabama"
        awayTeam="Georgia"
      />
    );
    expect(screen.getByText("Alabama (home)")).toBeInTheDocument();
  });

  it("renders nothing when data is empty", () => {
    const { container } = render(
      <WinProbChart data={[]} homeTeam="Alabama" awayTeam="Georgia" />
    );
    expect(container.firstChild).toBeNull();
  });
});
