import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";
import i18n from "i18next";
import { addResource, gameinfo } from "@abstractplay/gameslib";
import enApgames from "../../node_modules/@abstractplay/gameslib/locales/en/apgames.json";
import {
  buildGameOptions,
  collectBoardFilterOptions,
  filterGameOptions,
  getGameDisplayName,
  isExperimentalGame,
  isPublicCatalogGame,
  isBoardRootCategory,
  pickRandomGameOption,
  resolveMetaGameUid,
} from "./gameOptions";
import { isProductionMode } from "./realMode";

vi.mock("./realMode", () => ({
  isProductionMode: vi.fn(() => false),
}));

beforeEach(() => {
  vi.mocked(isProductionMode).mockReturnValue(false);
});

beforeAll(async () => {
  await i18n.init({
    lng: "en",
    ns: ["apgames"],
    resources: { en: { apgames: enApgames } },
  });
  addResource("en", i18n);
});

describe("getGameDisplayName", () => {
  it("returns the catalog name for a known uid", () => {
    const uid = [...gameinfo.keys()][0];
    expect(getGameDisplayName(uid)).toBe(gameinfo.get(uid).name);
  });

  it("returns localized name when apgames bundle has a translation", async () => {
    const deBundle = {
      ...enApgames,
      names: {
        ...enApgames.names,
        hex: "Hex (DE)",
      },
    };
    await i18n.changeLanguage("de");
    i18n.addResourceBundle("de", "apgames", deBundle, true, true);
    addResource("de", i18n);
    expect(getGameDisplayName("hex")).toBe("Hex (DE)");
    await i18n.changeLanguage("en");
    addResource("en", i18n);
  });

  it("returns fallback for unknown uid", () => {
    expect(getGameDisplayName("not-a-real-game", "Unknown")).toBe("Unknown");
    expect(getGameDisplayName("not-a-real-game")).toBe("not-a-real-game");
  });

  it("returns Unknown for empty uid without fallback", () => {
    expect(getGameDisplayName("")).toBe("Unknown");
  });
});

describe("resolveMetaGameUid", () => {
  it("returns canonical uid for case-insensitive match", () => {
    const uid = [...gameinfo.keys()][0];
    expect(resolveMetaGameUid(uid)).toBe(uid);
    expect(resolveMetaGameUid(uid.toUpperCase())).toBe(uid);
    expect(resolveMetaGameUid(uid.toLowerCase())).toBe(uid);
  });

  it("returns undefined for unknown uid", () => {
    expect(resolveMetaGameUid("not-a-real-game")).toBeUndefined();
  });
});

describe("isPublicCatalogGame", () => {
  it("hides experimental games in production", () => {
    vi.mocked(isProductionMode).mockReturnValue(true);
    expect(isExperimentalGame({ flags: ["experimental"] })).toBe(true);
    expect(isPublicCatalogGame({ flags: ["experimental"] })).toBe(false);
    expect(isPublicCatalogGame({ flags: [] })).toBe(true);
  });

  it("shows experimental games outside production", () => {
    vi.mocked(isProductionMode).mockReturnValue(false);
    expect(isPublicCatalogGame({ flags: ["experimental"] })).toBe(true);
  });
});

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

  it("labOnly excludes solo-only games", () => {
    const lab = buildGameOptions({ labOnly: true });
    for (const { id } of lab) {
      const playercounts = gameinfo.get(id).playercounts;
      expect(
        playercounts.length === 1 && playercounts[0] === 1
      ).toBe(false);
    }
  });

  it("tournamentOnly excludes games without playercount 2", () => {
    const all = buildGameOptions();
    const tournament = buildGameOptions({ tournamentOnly: true });
    expect(tournament.length).toBeLessThanOrEqual(all.length);
    for (const { id } of tournament) {
      expect(gameinfo.get(id).playercounts.includes(2)).toBe(true);
    }
  });

  it("excludes experimental games in production", () => {
    const experimental = [...gameinfo.values()].find((info) =>
      info.flags.includes("experimental")
    );
    if (!experimental) {
      return;
    }
    vi.mocked(isProductionMode).mockReturnValue(true);
    const options = buildGameOptions();
    expect(options.some(({ id }) => id === experimental.uid)).toBe(false);
  });
});

describe("pickRandomGameOption", () => {
  it("returns a lab-supported game", () => {
    const picked = pickRandomGameOption({ labOnly: true });
    expect(picked).not.toBeNull();
    expect(gameinfo.has(picked.id)).toBe(true);
    expect(gameinfo.get(picked.id).flags.includes("simultaneous")).toBe(false);
    const playercounts = gameinfo.get(picked.id).playercounts;
    expect(playercounts.length === 1 && playercounts[0] === 1).toBe(false);
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
    expect(filterGameOptions(tagged, { goalTag: "goal.territory" })).toEqual([
      tagged[0],
    ]);
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
