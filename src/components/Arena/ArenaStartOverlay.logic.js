import { isArenaGame } from "../../lib/arena/arenaGame";
import { arenaSyncedNow } from "../../lib/arena/applyArenaClockSync";

/**
 * @param {number} liveClockNow wall `Date.now()` from the session tick (not pre-synced)
 * @param {boolean} countdownComplete once true, never show start overlay again this game
 */
export function computeArenaStartOverlay(dbgame, liveClockNow, countdownComplete = false) {
  if (countdownComplete) {
    return null;
  }
  if (!dbgame || !isArenaGame(dbgame) || dbgame.gameOver || dbgame.toMove === "") {
    return null;
  }
  if ((dbgame.numMoves ?? 0) > 0) {
    return null;
  }
  const startAt = dbgame.arenaClockStartAt;
  if (startAt === undefined || startAt === null) {
    return { visible: true, kind: "waiting" };
  }
  const now = arenaSyncedNow(dbgame, liveClockNow);
  if (now < startAt) {
    const seconds = Math.max(1, Math.ceil((startAt - now) / 1000));
    return { visible: true, kind: "countdown", seconds, startAt };
  }
  return null;
}
