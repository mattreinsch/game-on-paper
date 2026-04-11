import React from "react";
import { render, screen } from "@testing-library/react";
import BoxScore from "@/components/BoxScore";

const BOX_SCORE = {
  teams: [
    {
      homeAway: "home",
      team: { displayName: "Alabama Crimson Tide" },
      statistics: [
        { name: "totalYards", displayValue: "412", label: "Total Yards" },
        { name: "netPassingYards", displayValue: "298", label: "Passing Yards" },
        { name: "rushingYards", displayValue: "114", label: "Rushing Yards" },
      ],
    },
    {
      homeAway: "away",
      team: { displayName: "Georgia Bulldogs" },
      statistics: [
        { name: "totalYards", displayValue: "310", label: "Total Yards" },
        { name: "netPassingYards", displayValue: "201", label: "Passing Yards" },
        { name: "rushingYards", displayValue: "109", label: "Rushing Yards" },
      ],
    },
  ],
};

describe("BoxScore", () => {
  it("renders both team names", () => {
    render(<BoxScore boxScore={BOX_SCORE} />);
    expect(screen.getByText("Alabama Crimson Tide")).toBeInTheDocument();
    expect(screen.getByText("Georgia Bulldogs")).toBeInTheDocument();
  });

  it("renders stat labels", () => {
    render(<BoxScore boxScore={BOX_SCORE} />);
    expect(screen.getByText("Total Yards")).toBeInTheDocument();
    expect(screen.getByText("Passing Yards")).toBeInTheDocument();
  });

  it("renders stat values", () => {
    render(<BoxScore boxScore={BOX_SCORE} />);
    expect(screen.getByText("412")).toBeInTheDocument();
    expect(screen.getByText("310")).toBeInTheDocument();
  });

  it("renders nothing when boxScore has no teams", () => {
    const { container } = render(<BoxScore boxScore={{}} />);
    expect(container.firstChild).toBeNull();
  });
});
