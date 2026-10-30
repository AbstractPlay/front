import { describe, expect, it, beforeEach } from "vitest";
import {
  STORAGE_ARENA_LAST_CREATE,
  STORAGE_ARENA_PREFERRED_TC,
  readArenaLastCreate,
  writeArenaLastCreate,
} from "./fetchArena.js";

describe("arena last create prefs", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_ARENA_LAST_CREATE);
    localStorage.removeItem(STORAGE_ARENA_PREFERRED_TC);
  });

  it("reads empty game and legacy tc when nothing stored", () => {
    localStorage.setItem(STORAGE_ARENA_PREFERRED_TC, "rapid_10_5");
    expect(readArenaLastCreate()).toEqual({
      metaGame: "",
      arenaTcId: "rapid_10_5",
      variants: [],
    });
  });

  it("round-trips metaGame, arenaTcId, and variants", () => {
    writeArenaLastCreate({
      metaGame: "abande",
      arenaTcId: "blitz_3_2",
      variants: ["small", "bad"],
    });
    expect(readArenaLastCreate()).toEqual({
      metaGame: "abande",
      arenaTcId: "blitz_3_2",
      variants: ["small", "bad"],
    });
    expect(localStorage.getItem(STORAGE_ARENA_PREFERRED_TC)).toBe("blitz_3_2");
    expect(JSON.parse(localStorage.getItem(STORAGE_ARENA_LAST_CREATE))).toEqual({
      metaGame: "abande",
      arenaTcId: "blitz_3_2",
      variants: ["small", "bad"],
    });
  });

  it("ignores non-string variant entries when reading", () => {
    localStorage.setItem(
      STORAGE_ARENA_LAST_CREATE,
      JSON.stringify({
        metaGame: "go",
        arenaTcId: "blitz_5_3",
        variants: ["ok", 1, null, ""],
      }),
    );
    expect(readArenaLastCreate().variants).toEqual(["ok"]);
  });
});
