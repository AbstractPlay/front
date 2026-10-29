export const ARENA_MOVE_BASE = "/arena/play";
export const ARENA_WATCH_BASE = "/arena/watch";

export function isArenaPlayOrWatchBase(basePath) {
  return basePath === ARENA_MOVE_BASE || basePath === ARENA_WATCH_BASE;
}

/** Route params for arena play/watch shells (cbits always 0). */
export function arenaGameRouteParams(metaGame, gameID) {
  return {
    metaGame,
    cbits: "0",
    gameID,
  };
}
