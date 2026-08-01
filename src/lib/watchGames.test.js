import { collectWatchGames } from "./watchGames";

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
