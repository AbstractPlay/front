import { collectWatchGames, gameUpdateMatchesGame } from "./watchGames";

describe("collectWatchGames", () => {
  it("includes the current game route", () => {
    const games = collectWatchGames(null, "/move/chess/0/abc123");
    expect(games).toEqual([{ meta: "chess", id: "abc123" }]);
  });

  it("includes active dashboard games", () => {
    const globalMe = {
      games: [
        { metaGame: "go", id: "g1", toMove: "player1" },
        { metaGame: "chess", id: "c1", toMove: "" },
      ],
    };
    const games = collectWatchGames(globalMe, "/");
    expect(games).toEqual([{ meta: "go", id: "g1" }]);
  });

  it("deduplicates route and dashboard entries", () => {
    const globalMe = {
      games: [{ metaGame: "chess", id: "abc123", toMove: "player1" }],
    };
    const games = collectWatchGames(globalMe, "/move/chess/0/abc123");
    expect(games).toEqual([{ meta: "chess", id: "abc123" }]);
  });

  it("treats multiplayer games with players as active", () => {
    const globalMe = {
      games: [{ metaGame: "multi", id: "m1", toMove: [], players: ["a", "b"] }],
    };
    const games = collectWatchGames(globalMe, "/");
    expect(games).toEqual([{ meta: "multi", id: "m1" }]);
  });

  it("ignores multiplayer games with no players", () => {
    const globalMe = {
      games: [{ metaGame: "multi", id: "m1", toMove: [], players: [] }],
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
