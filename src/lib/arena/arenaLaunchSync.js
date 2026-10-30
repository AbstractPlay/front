import { isArenaGame } from "./arenaGame";
import { arenaSyncedNow } from "./applyArenaClockSync";

/** Mirror backend isArenaCompetitiveClockLive (Fischer running after countdown). */
export function isArenaCompetitiveClockLive(game, liveClockNow = Date.now()) {
  const startAt = game?.arenaClockStartAt;
  if (startAt === undefined || startAt === null) {
    return false;
  }
  return arenaSyncedNow(game, liveClockNow) >= startAt;
}

/**
 * Pre-move launch sync: waiting for play_ready and/or countdown, before Fischer is live.
 * @param {object} game hydrated GAME row
 * @param {number} [liveClockNow] wall clock from session tick when available
 */
export function isArenaLaunchSyncWindow(game, liveClockNow = Date.now()) {
  if (!game || !isArenaGame(game) || game.gameOver || game.toMove === "") {
    return false;
  }
  if ((game.numMoves ?? 0) > 0) {
    return false;
  }
  if (isArenaCompetitiveClockLive(game, liveClockNow)) {
    return false;
  }
  return true;
}

/** Seated player may abort half-started launch back to lobby. */
export function canAbortArenaLaunchSync(game, userId, liveClockNow = Date.now()) {
  if (!userId || !isArenaLaunchSyncWindow(game, liveClockNow)) {
    return false;
  }
  return (game.players ?? []).some((p) => p.id === userId);
}

/** @param {{ me?: number }} game play session row with seat index */
export function canAbortArenaLaunchSyncAsPlayer(game, liveClockNow = Date.now()) {
  if (!game || typeof game.me !== "number" || game.me < 0) {
    return false;
  }
  return isArenaLaunchSyncWindow(game, liveClockNow);
}
