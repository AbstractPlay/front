import { describe, expect, it } from "vitest";
import {
  anyOnClockPlayerTimedOutForTimelossHint,
  ARENA_TIMELOSS_HINT_GRACE_MS,
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

  it("waits for arena grace before hinting", () => {
    const now = 1000 + 500 + ARENA_TIMELOSS_HINT_GRACE_MS - 1;
    expect(anyOnClockPlayerTimedOutForTimelossHint(baseGame, now)).toBe(false);
    const afterGrace = 1000 + 500 + ARENA_TIMELOSS_HINT_GRACE_MS + 1;
    expect(anyOnClockPlayerTimedOutForTimelossHint(baseGame, afterGrace)).toBe(
      true
    );
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
