import { describe, expect, it } from "vitest";
import {
  participantTimelossPollIntervalMs,
  shouldParticipantCallTimelossCheck,
  shouldParticipantPollTimeloss,
  shouldSpectatorRefreshHintTimeloss,
} from "./participantTimelossPoll.js";
import { ARENA_TIMELOSS_HINT_GRACE_MS } from "../gameClockDisplay.js";

describe("participantTimelossPoll", () => {
  const onClockPlayerId = "player-on-clock";
  const arenaTimedOutGame = () => {
    const clockDisplayServerTime = 1_000_000;
    const remainingMs = 200;
    const now =
      clockDisplayServerTime + remainingMs + ARENA_TIMELOSS_HINT_GRACE_MS + 50;
    return {
      game: {
        playMode: "arena",
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

  it("regression: seated on-clock player is skipped by spectator refresh path", () => {
    const { game, now } = arenaTimedOutGame();
    expect(shouldSpectatorRefreshHintTimeloss(game, onClockPlayerId)).toBe(
      false
    );
    expect(shouldParticipantCallTimelossCheck(game, now)).toBe(true);
  });

  it("spectator refresh still hints when not seated and display is past zero", () => {
    const { game, now } = arenaTimedOutGame();
    expect(shouldSpectatorRefreshHintTimeloss(game, "spectator-id")).toBe(true);
    expect(shouldParticipantCallTimelossCheck(game, now)).toBe(true);
  });

  it("participant poll runs for hard-clock in-progress games", () => {
    const { game } = arenaTimedOutGame();
    expect(shouldParticipantPollTimeloss(game)).toBe(true);
    expect(participantTimelossPollIntervalMs(game)).toBe(1500);
  });

  it("does not poll when game is over or correspondence soft clock", () => {
    const { game, now } = arenaTimedOutGame();
    expect(shouldParticipantPollTimeloss({ ...game, gameOver: true })).toBe(
      false
    );
    expect(
      shouldParticipantPollTimeloss({ ...game, clockHard: false })
    ).toBe(false);
    expect(
      participantTimelossPollIntervalMs({ ...game, playMode: "correspondence" })
    ).toBe(3000);
    expect(shouldParticipantCallTimelossCheck({ ...game, toMove: "" }, now)).toBe(
      false
    );
  });
});
