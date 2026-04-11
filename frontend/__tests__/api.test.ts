import { fetchScoreboard, fetchGame } from "@/lib/api";

const MOCK_SCOREBOARD = {
  games: [{ id: "401628444", home_team: { name: "Alabama" } }],
};

const MOCK_GAME = { game_id: "401628444", status: "STATUS_FINAL" };

describe("fetchScoreboard", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("calls the correct URL and returns games", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SCOREBOARD,
    });

    const result = await fetchScoreboard("cfb", "2025", 1);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/scoreboard/cfb"),
      expect.any(Object)
    );
    expect(result.games[0].id).toBe("401628444");
  });

  it("throws on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchScoreboard("cfb", "2025", 1)).rejects.toThrow("500");
  });
});

describe("fetchGame", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("calls the correct URL and returns game detail", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_GAME,
    });

    const result = await fetchGame("cfb", "401628444");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/game/cfb/401628444"),
      expect.any(Object)
    );
    expect(result.game_id).toBe("401628444");
  });
});
