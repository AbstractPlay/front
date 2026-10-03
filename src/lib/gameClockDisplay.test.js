import { describe, expect, it } from "vitest";
import { isPlayerTimedOut } from "./gameClockDisplay";

const T0 = Date.parse("2026-06-15T12:00:00.000Z");

function onClockGame(overrides = {}) {
  return {
    toMove: "0",
    clockDisplayServerTime: T0,
    lastMoveTime: T0 - 3_600_000,
    players: [{ id: "p0", time: 3_600_000 }],
    ...overrides,
  };
}

describe("isPlayerTimedOut", () => {
  it("is true when effective remaining is negative even if clock is paused (vacation)", () => {
    const game = onClockGame();
    const player = {
      effectiveRemainingMs: -30 * 60 * 1000,
      clockPaused: true,
    };
    expect(isPlayerTimedOut(player, game, game.toMove, 0, T0 + 60_000)).toBe(
      true,
    );
  });

  it("is false when paused and effective remaining is still positive", () => {
    const game = onClockGame();
    const player = {
      effectiveRemainingMs: 60_000,
      clockPaused: true,
    };
    expect(isPlayerTimedOut(player, game, game.toMove, 0, T0 + 60_000)).toBe(
      false,
    );
  });

  it("is false for players not on the clock", () => {
    const game = onClockGame({ toMove: "1", players: [{ id: "p0" }, { id: "p1" }] });
    const player = {
      effectiveRemainingMs: -1000,
      clockPaused: true,
    };
    expect(isPlayerTimedOut(player, game, game.toMove, 0, T0)).toBe(false);
  });
});
