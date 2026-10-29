import { describe, expect, it } from "vitest";
import {
  anyOnClockPlayerTimedOutForTimelossHint,
} from "./gameClockDisplay.js";

describe("anyOnClockPlayerTimedOutForTimelossHint", () => {
  const baseGame = {
    playMode: "arena",
    toMove: "0",
    clockDisplayServerTime: 1000,
    lastMoveTime: 1000,
    players: [
      { id: "a", effectiveRemainingMs: 500, time: 500 },
      { id: "b", time: 60_000 },
    ],
  };

  it("hints once display passes zero for arena (server applies grace)", () => {
    expect(anyOnClockPlayerTimedOutForTimelossHint(baseGame, 1499)).toBe(false);
    expect(anyOnClockPlayerTimedOutForTimelossHint(baseGame, 1500)).toBe(true);
  });

  it("hints at zero for correspondence", () => {
    const game = {
      playMode: "correspondence",
      toMove: "0",
      clockDisplayServerTime: 1000,
      lastMoveTime: 1000,
      players: [{ id: "a", effectiveRemainingMs: 100, time: 100 }],
    };
    expect(anyOnClockPlayerTimedOutForTimelossHint(game, 1099)).toBe(false);
    expect(anyOnClockPlayerTimedOutForTimelossHint(game, 1100)).toBe(true);
  });
});
