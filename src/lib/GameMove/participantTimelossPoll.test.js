import { describe, expect, it } from "vitest";
import {
  participantTimelossPollIntervalMs,
  shouldParticipantCallTimelossCheck,
  shouldParticipantPollTimeloss,
  shouldSpectatorRefreshHintTimeloss,
} from "./participantTimelossPoll.js";

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

  it("arena: no client timeloss hints (scheduler + WS refresh)", () => {
    const { game, now } = hardClockTimedOutGame("arena");
    expect(shouldSpectatorRefreshHintTimeloss(game, onClockPlayerId)).toBe(
      false
    );
    expect(shouldSpectatorRefreshHintTimeloss(game, "spectator-id")).toBe(
      false
    );
    expect(shouldParticipantPollTimeloss(game)).toBe(false);
    expect(shouldParticipantCallTimelossCheck(game, now)).toBe(false);
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
