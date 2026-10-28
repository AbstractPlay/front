import { anyOnClockPlayerTimedOut, anyOnClockPlayerTimedOutForTimelossHint } from "../gameClockDisplay.js";
import { isArenaGame } from "../arena/arenaGame.js";

/**
 * runGameMetaTail only hints timeloss for viewers who are not seated at the table.
 * Seated players need a separate poll (see useGameMoveSession participant timeloss effect).
 */
export function shouldSpectatorRefreshHintTimeloss(game, viewerPlayerId) {
  if (!game || game.toMove === "" || game.toMove === undefined) {
    return false;
  }
  if (game.players?.some((p) => p.id === viewerPlayerId)) {
    return false;
  }
  if (!game.clockHard) {
    return false;
  }
  return anyOnClockPlayerTimedOut(game);
}

export function shouldParticipantPollTimeloss(game) {
  if (!game || game.gameOver || game.toMove === "" || game.toMove === undefined) {
    return false;
  }
  if (!game.clockHard) {
    return false;
  }
  return true;
}

export function shouldParticipantCallTimelossCheck(game, now = Date.now()) {
  if (!shouldParticipantPollTimeloss(game)) {
    return false;
  }
  return anyOnClockPlayerTimedOutForTimelossHint(game, now);
}

export function participantTimelossPollIntervalMs(game) {
  return isArenaGame(game) ? 500 : 3000;
}
