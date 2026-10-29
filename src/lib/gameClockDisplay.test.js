import { describe, expect, it } from "vitest";
import {
  anyOnClockPlayerTimedOutForTimelossHint,
  isArenaClientClockLive,
  tickActivePlayerRemainingMs,
} from "./gameClockDisplay.js";

describe("isArenaClientClockLive", () => {
  it("stays frozen until arenaClockStartAt is known and reached", () => {
    const game = { playMode: "arena", arenaClockStartAt: 5000 };
    expect(isArenaClientClockLive(game, 4999)).toBe(false);
    expect(isArenaClientClockLive(game, 5000)).toBe(true);
    expect(isArenaClientClockLive({ playMode: "arena" }, 9000)).toBe(false);
  });
});

describe("tickActivePlayerRemainingMs (arena sync)", () => {
  it("does not drain before synchronized start", () => {
    const game = {
      playMode: "arena",
      toMove: "0",
      lastMoveTime: 1000,
      arenaClockStartAt: 10_000,
      players: [{ id: "a", time: 120_000 }],
    };
    expect(tickActivePlayerRemainingMs(game.players[0], game, "0", 0, 2000)).toBe(
      120_000
    );
  });

  it("ignores effectiveRemainingMs; uses Fischer bank and lastMoveTime", () => {
    const game = {
      playMode: "arena",
      toMove: "0",
      lastMoveTime: 10_000,
      arenaClockStartAt: 0,
      arenaServerClockOffsetMs: 0,
      clockDisplayServerTime: 10_000,
      players: [{ id: "a", time: 100_000, effectiveRemainingMs: 50_000 }],
    };
    expect(tickActivePlayerRemainingMs(game.players[0], game, "0", 0, 11_000)).toBe(
      99_000
    );
  });
});

describe("anyOnClockPlayerTimedOutForTimelossHint", () => {
  const baseGame = {
    playMode: "arena",
    toMove: "0",
    arenaClockStartAt: 0,
    lastMoveTime: 1000,
    arenaServerClockOffsetMs: 0,
    players: [{ id: "a", time: 500 }, { id: "b", time: 60_000 }],
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
