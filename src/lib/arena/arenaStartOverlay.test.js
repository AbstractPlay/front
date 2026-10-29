import { describe, expect, it } from "vitest";
import { computeArenaStartOverlay } from "../../components/Arena/ArenaStartOverlay.logic.js";

describe("computeArenaStartOverlay", () => {
  it("uses server offset so both clients see the same countdown second", () => {
    const game = {
      playMode: "arena",
      toMove: "0",
      numMoves: 0,
      arenaClockStartAt: 10_000,
      arenaServerClockOffsetMs: 500,
    };
    expect(computeArenaStartOverlay(game, 7500, false)?.seconds).toBe(2);
    expect(computeArenaStartOverlay(game, 9500, false)).toBeNull();
  });

  it("never shows after countdownComplete or once moves exist", () => {
    const game = {
      playMode: "arena",
      toMove: "0",
      numMoves: 3,
      arenaClockStartAt: 10_000,
      arenaServerClockOffsetMs: 0,
    };
    expect(computeArenaStartOverlay(game, 5000, false)).toBeNull();
    expect(
      computeArenaStartOverlay(
        { ...game, numMoves: 0 },
        5000,
        true
      )
    ).toBeNull();
  });
});
