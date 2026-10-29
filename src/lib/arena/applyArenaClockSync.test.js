import { describe, expect, it } from "vitest";
import { mergeArenaClockSync } from "./applyArenaClockSync.js";

describe("mergeArenaClockSync", () => {
  it("sets lastMoveTime and server offset to match server countdown", () => {
    const game = {
      id: "g1",
      playMode: "arena",
      lastMoveTime: 100,
      players: [{ id: "a", time: 120_000 }],
    };
    const before = Date.now();
    const merged = mergeArenaClockSync(game, {
      arenaClockStartAt: 5000,
      serverTime: 2000,
    });
    const after = Date.now();
    expect(merged.arenaClockStartAt).toBe(5000);
    expect(merged.lastMoveTime).toBe(5000);
    expect(merged.clockDisplayServerTime).toBe(2000);
    expect(merged.arenaServerClockOffsetMs).toBeGreaterThanOrEqual(2000 - after);
    expect(merged.arenaServerClockOffsetMs).toBeLessThanOrEqual(2000 - before);
    expect(merged.players[0].effectiveRemainingMs).toBeUndefined();
  });
});
