import { collectWatchGames, gameUpdateMatchesGame } from "./watchGames";

describe("collectWatchGames", () => {
  it("includes the current game route", () => {
    const games = collectWatchGames(null, "/move/chess/0/abc123");
    expect(games).toEqual([{ meta: "chess", id: "abc123" }]);
  });

  it("includes active games from activeGames", () => {
    const globalMe = {
      activeGames: [
        { metaGame: "go", id: "g1" },
        { metaGame: "chess", id: "c1" },
      ],
    };
    const games = collectWatchGames(globalMe, "/");
    expect(games).toEqual([
      { meta: "go", id: "g1" },
      { meta: "chess", id: "c1" },
    ]);
  });

  it("deduplicates route and activeGames entries", () => {
    const globalMe = {
      activeGames: [{ metaGame: "chess", id: "abc123" }],
    };
    const games = collectWatchGames(globalMe, "/move/chess/0/abc123");
    expect(games).toEqual([{ meta: "chess", id: "abc123" }]);
  });

  it("ignores globalMe without activeGames off-dashboard", () => {
    const globalMe = {
      games: [{ metaGame: "go", id: "g1", toMove: "player1" }],
    };
    const games = collectWatchGames(globalMe, "/");
    expect(games).toEqual([]);
  });
});

describe("gameUpdateMatchesGame", () => {
  it("returns true when meta and id match", () => {
    expect(
      gameUpdateMatchesGame({ meta: "chess", id: "abc123" }, "chess", "abc123")
    ).toBe(true);
  });

  it("returns false when id differs", () => {
    expect(
      gameUpdateMatchesGame({ meta: "chess", id: "other" }, "chess", "abc123")
    ).toBe(false);
  });

  it("returns false when meta differs", () => {
    expect(
      gameUpdateMatchesGame({ meta: "go", id: "abc123" }, "chess", "abc123")
    ).toBe(false);
  });

  it("returns false when payload is missing", () => {
    expect(gameUpdateMatchesGame(undefined, "chess", "abc123")).toBe(false);
    expect(gameUpdateMatchesGame(null, "chess", "abc123")).toBe(false);
    expect(gameUpdateMatchesGame({}, "chess", "abc123")).toBe(false);
  });
});
