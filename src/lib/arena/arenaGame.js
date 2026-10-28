import { tournamentPlaySupported } from "../tournamentGame";

/** Arena v1: same 2-player gate as tournaments / ladders. */
export function arenaPlaySupported(metaGame) {
  return tournamentPlaySupported(metaGame);
}

export function isArenaGame(game) {
  return game?.playMode === "arena";
}
