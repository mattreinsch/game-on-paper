export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  score: number;
  rank?: number | null;
}

export interface Game {
  id: string;
  start_time: string;
  status: string;
  status_completed: boolean;
  display_clock: string;
  period: number;
  home_team: Team;
  away_team: Team;
  excitement_level: "gray" | "green" | "yellow" | "orange" | "red";
}

export interface ScoreboardResponse {
  games: Game[];
}

export interface Play {
  id: string;
  text: string;
  wallclock: string;
  start: {
    down: number | null;
    distance: number | null;
    yards_to_endzone: number | null;
  };
}

export interface WinProbabilityPoint {
  play_id: string;
  home_wp: number;
  seconds_left: number;
}

export interface Drive {
  id: string;
  description: string;
  yards: number;
  num_plays: number;
  start: string;
  end: string;
  result: string;
}

export interface GameDetail {
  game_id: string;
  status: string;
  status_completed: boolean;
  period: number;
  display_clock: string;
  home_team: Omit<Team, "rank">;
  away_team: Omit<Team, "rank">;
  plays: Play[];
  win_probability: WinProbabilityPoint[];
  box_score: Record<string, unknown>;
  drives: Drive[];
}
