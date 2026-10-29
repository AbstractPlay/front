import { describe, expect, it } from "vitest";
import {
  participantTimelossPollIntervalMs,
  shouldArenaTimelossBackupCall,
  shouldParticipantCallTimelossCheck,
  shouldParticipantPollTimeloss,
  shouldSpectatorRefreshHintTimeloss,
} from "./participantTimelossPoll.js";
import { ARENA_TIMELOSS_HINT_GRACE_MS } from "../gameClockDisplay.js";

describe("participantTimelossPoll", () => {
  const onClockPlayerId = "player-on-clock";
  const hardClockTimedOutGame = (playMode = "correspondence") => {
    const clockDisplayServerTime = 1_000_000;
    const remainingMs = 200;
    const now = clockDisplayServerTime + remainingMs + 50;
    return {
      game: {
        playMode,
        clockHard: true,
        toMove: "0",
        clockDisplayServerTime,
        lastMoveTime: clockDisplayServerTime,
        ...(playMode === "arena"
          ? { arenaClockStartAt: clockDisplayServerTime }
          : {}),
        players: [
          {
            id: onClockPlayerId,
            effectiveRemainingMs: remainingMs,
            time: remainingMs,
          },
          { id: "opponent", time: 60_000 },
        ],
      },
      now,
    };
  };

  it("arena: no routine timeloss poll (scheduler + WS)", () => {
    const { game, now } = hardClockTimedOutGame("arena");
    expect(shouldSpectatorRefreshHintTimeloss(game, onClockPlayerId)).toBe(
      false
    );
    expect(shouldParticipantPollTimeloss(game)).toBe(false);
    expect(shouldParticipantCallTimelossCheck(game, now)).toBe(false);
  });

  it("arena: backup timeloss after server grace when display is overtime", () => {
    const { game } = hardClockTimedOutGame("arena");
    const now = game.lastMoveTime + game.players[0].time + 500;
    expect(shouldArenaTimelossBackupCall(game, now)).toBe(false);
    const overdue =
      game.lastMoveTime + game.players[0].time + ARENA_TIMELOSS_HINT_GRACE_MS + 50;
    expect(shouldArenaTimelossBackupCall(game, overdue)).toBe(true);
  });

  it("correspondence: seated on-clock player skipped by spectator path", () => {
    const { game, now } = hardClockTimedOutGame("correspondence");
    expect(shouldSpectatorRefreshHintTimeloss(game, onClockPlayerId)).toBe(
      false
    );
    expect(shouldParticipantCallTimelossCheck(game, now)).toBe(true);
  });

  it("correspondence: spectator hints when display is past zero", () => {
    const { game, now } = hardClockTimedOutGame("correspondence");
    expect(shouldSpectatorRefreshHintTimeloss(game, "spectator-id")).toBe(true);
    expect(shouldParticipantCallTimelossCheck(game, now)).toBe(true);
  });

  it("correspondence: participant poll for hard-clock in-progress games", () => {
    const { game } = hardClockTimedOutGame("correspondence");
    expect(shouldParticipantPollTimeloss(game)).toBe(true);
    expect(participantTimelossPollIntervalMs()).toBe(3000);
  });

  it("does not poll when game is over or soft clock", () => {
    const { game, now } = hardClockTimedOutGame("correspondence");
    expect(shouldParticipantPollTimeloss({ ...game, gameOver: true })).toBe(
      false
    );
    expect(
      shouldParticipantPollTimeloss({ ...game, clockHard: false })
    ).toBe(false);
    expect(shouldParticipantCallTimelossCheck({ ...game, toMove: "" }, now)).toBe(
      false
    );
  });
});
