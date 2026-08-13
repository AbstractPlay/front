import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import {
  buildGameOptions,
  collectBoardFilterOptions,
  filterGameOptions,
  isBoardRootCategory,
  pickRandomGameOption,
} from "./gameOptions";

describe("buildGameOptions", () => {
  it("returns sorted games from gameinfo", () => {
    const options = buildGameOptions();
    expect(options.length).toBeGreaterThan(0);
    const names = options.map((o) => o.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("labOnly excludes simultaneous games", () => {
    const all = buildGameOptions();
    const lab = buildGameOptions({ labOnly: true });
    expect(lab.length).toBeLessThanOrEqual(all.length);
    for (const { id } of lab) {
      expect(gameinfo.get(id).flags.includes("simultaneous")).toBe(false);
    }
  });
});

describe("pickRandomGameOption", () => {
  it("returns a lab-supported game", () => {
    const picked = pickRandomGameOption({ labOnly: true });
    expect(picked).not.toBeNull();
    expect(gameinfo.has(picked.id)).toBe(true);
    expect(gameinfo.get(picked.id).flags.includes("simultaneous")).toBe(false);
  });
});

describe("collectBoardFilterOptions", () => {
  it("includes shape and root board tags", () => {
    const games = buildGameOptions().map(({ id }) => ({
      categories: gameinfo.get(id).categories ?? [],
    }));
    const options = collectBoardFilterOptions(games);
    expect(options.some((c) => c.startsWith("board>shape"))).toBe(true);
    expect(options.some((c) => isBoardRootCategory(c))).toBe(true);
    expect(options.some((c) => c.startsWith("board>connect"))).toBe(false);
  });
});

describe("filterGameOptions", () => {
  const games = [
    { id: "chess", name: "Chess", designers: "Anonymous" },
    { id: "go", name: "Go", designers: "Ancient" },
  ];

  it("filters by name substring", () => {
    expect(filterGameOptions(games, { query: "che" })).toEqual([games[0]]);
  });

  it("filters starred only", () => {
    expect(
      filterGameOptions(games, {
        starredOnly: true,
        starredIds: ["go"],
      })
    ).toEqual([games[1]]);
  });

  it("returns all games when query empty", () => {
    expect(filterGameOptions(games, { query: "" })).toEqual(games);
  });

  it("filters by goal tag", () => {
    const tagged = [
      {
        id: "a",
        name: "Alpha",
        categories: ["goal.territory", "board>shape.square"],
      },
      {
        id: "b",
        name: "Beta",
        categories: ["goal.connect", "board>shape.hex"],
      },
    ];
    expect(
      filterGameOptions(tagged, { goalTag: "goal.territory" })
    ).toEqual([tagged[0]]);
  });

  it("filters by goal and board shape together", () => {
    const tagged = [
      {
        id: "a",
        name: "Alpha",
        categories: ["goal.territory", "board>shape.square"],
      },
      {
        id: "b",
        name: "Beta",
        categories: ["goal.territory", "board>shape.hex"],
      },
    ];
    expect(
      filterGameOptions(tagged, {
        goalTag: "goal.territory",
        boardTag: "board>shape.hex",
      })
    ).toEqual([tagged[1]]);
  });

  it("filters by root board tags", () => {
    const tagged = [
      { id: "a", name: "Alpha", categories: ["board>dynamic"] },
      { id: "b", name: "Beta", categories: ["board>none"] },
    ];
    expect(filterGameOptions(tagged, { boardTag: "board>none" })).toEqual([
      tagged[1],
    ]);
  });
});
