import React from "react";
import { render, screen } from "@testing-library/react";
import GameCard from "@/components/GameCard";
import type { Game } from "@/lib/types";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const GAME: Game = {
  id: "401628444",
  start_time: "2025-09-06T18:00:00Z",
  status: "STATUS_FINAL",
  status_completed: true,
  display_clock: "0:00",
  period: 4,
  home_team: {
    id: "333",
    name: "Alabama Crimson Tide",
    abbreviation: "ALA",
    logo: "https://a.espncdn.com/i/teamlogos/cfb/500/333.png",
    score: 34,
    rank: 1,
  },
  away_team: {
    id: "61",
    name: "Georgia Bulldogs",
    abbreviation: "UGA",
    logo: "https://a.espncdn.com/i/teamlogos/cfb/500/61.png",
    score: 20,
    rank: null,
  },
  excitement_level: "green",
};

describe("GameCard", () => {
  it("renders both team names", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    expect(screen.getByText("Alabama Crimson Tide")).toBeInTheDocument();
    expect(screen.getByText("Georgia Bulldogs")).toBeInTheDocument();
  });

  it("renders scores", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders home team rank", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("renders a link to the game detail page", () => {
    render(<GameCard game={GAME} sport="cfb" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/cfb/game/401628444");
  });

  it("applies excitement_level border color class", () => {
    const { container } = render(<GameCard game={GAME} sport="cfb" />);
    // The outermost div inside the link should have border-green-500
    const card = container.querySelector(".border-green-500");
    expect(card).toBeInTheDocument();
  });
});
