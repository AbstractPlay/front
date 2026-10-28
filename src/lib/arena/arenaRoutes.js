export const ARENA_BASE = "/arena";

export function arenaLandingPath() {
  return ARENA_BASE;
}

export function arenaTablePath(metaGame, tableId) {
  return `${ARENA_BASE}/table/${encodeURIComponent(metaGame)}/${encodeURIComponent(tableId)}`;
}

export function arenaPlayPath(metaGame, gameId) {
  return `${ARENA_BASE}/play/${encodeURIComponent(metaGame)}/${encodeURIComponent(gameId)}`;
}

export function arenaWatchPath(metaGame, gameId) {
  return `${ARENA_BASE}/watch/${encodeURIComponent(metaGame)}/${encodeURIComponent(gameId)}`;
}

export function isArenaPath(pathname = "") {
  return pathname === ARENA_BASE || pathname.startsWith(`${ARENA_BASE}/`);
}
