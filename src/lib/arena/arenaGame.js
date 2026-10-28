import { tournamentPlaySupported } from "../tournamentGame";

/** Arena v1: same 2-player gate as tournaments / ladders. */
export function arenaPlaySupported(metaGame) {
  return tournamentPlaySupported(metaGame);
}

export function isArenaGame(game) {
  return game?.playMode === "arena";
}

/** Arena games must use submit_arena_move even if the shell defaulted to submit_move. */
export function resolveSubmitMoveQuery(game, preferredQuery = "submit_move") {
  if (isArenaGame(game)) {
    return "submit_arena_move";
  }
  return preferredQuery ?? "submit_move";
}
