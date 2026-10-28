export const ARENA_MOVE_BASE = "/arena/play";
export const ARENA_WATCH_BASE = "/arena/watch";

/** Route params for arena play/watch shells (cbits always 0). */
export function arenaGameRouteParams(metaGame, gameID) {
  return {
    metaGame,
    cbits: "0",
    gameID,
  };
}
