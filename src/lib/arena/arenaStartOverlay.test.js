import { describe, expect, it } from "vitest";
import { computeArenaStartOverlay } from "../../components/Arena/ArenaStartOverlay.logic.js";

describe("computeArenaStartOverlay", () => {
  it("uses server offset so both clients see the same countdown second", () => {
    const game = {
      playMode: "arena",
      toMove: "0",
      arenaClockStartAt: 10_000,
      arenaServerClockOffsetMs: 500,
    };
    expect(computeArenaStartOverlay(game, 7500)?.seconds).toBe(2);
    expect(computeArenaStartOverlay(game, 9500)).toBeNull();
  });
});
