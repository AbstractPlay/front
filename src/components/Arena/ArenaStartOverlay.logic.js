import { isArenaGame } from "../../lib/arena/arenaGame";
import { arenaSyncedNow } from "../../lib/arena/applyArenaClockSync";

export function computeArenaStartOverlay(dbgame, liveClockNow) {
  if (!dbgame || !isArenaGame(dbgame) || dbgame.gameOver || dbgame.toMove === "") {
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
