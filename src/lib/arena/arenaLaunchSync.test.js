import { describe, expect, it } from "vitest";
import {
  canAbortArenaLaunchSync,
  isArenaLaunchSyncWindow,
} from "./arenaLaunchSync.js";

const base = {
  playMode: "arena",
  toMove: "0",
  numMoves: 0,
  players: [{ id: "a" }, { id: "b" }],
};

describe("arenaLaunchSync client gate", () => {
  it("matches waiting and countdown phases", () => {
    expect(isArenaLaunchSyncWindow(base)).toBe(true);
    expect(
      isArenaLaunchSyncWindow({ ...base, arenaClockStartAt: 10_000 }, 5000)
    ).toBe(true);
    expect(
      isArenaLaunchSyncWindow({ ...base, arenaClockStartAt: 10_000 }, 10_000)
    ).toBe(false);
  });

  it("canAbort requires seated player id", () => {
    expect(canAbortArenaLaunchSync(base, "a")).toBe(true);
    expect(canAbortArenaLaunchSync(base, "spectator")).toBe(false);
  });
});
