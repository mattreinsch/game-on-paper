import React from "react";
import { render, screen } from "@testing-library/react";
import DrivesSummary from "@/components/DrivesSummary";
import type { Drive } from "@/lib/types";

const DRIVES: Drive[] = [
  {
    id: "1",
    description: "Touchdown Drive",
    yards: 75,
    num_plays: 8,
    start: "OWN 25",
    end: "OPP 0",
    result: "TD",
  },
  {
    id: "2",
    description: "Punt",
    yards: 12,
    num_plays: 3,
    start: "OWN 30",
    end: "OWN 42",
    result: "PUNT",
  },
];

describe("DrivesSummary", () => {
  it("renders drive results", () => {
    render(<DrivesSummary drives={DRIVES} />);
    expect(screen.getByText("TD")).toBeInTheDocument();
    expect(screen.getByText("PUNT")).toBeInTheDocument();
  });

  it("renders yards for each drive", () => {
    render(<DrivesSummary drives={DRIVES} />);
    expect(screen.getByText("75 yds")).toBeInTheDocument();
    expect(screen.getByText("12 yds")).toBeInTheDocument();
  });

  it("renders number of plays", () => {
    render(<DrivesSummary drives={DRIVES} />);
    expect(screen.getByText("8 plays")).toBeInTheDocument();
  });

  it("renders nothing when drives is empty", () => {
    const { container } = render(<DrivesSummary drives={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
