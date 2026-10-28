import { appendLayoutQuery } from "../GameMove/layoutPreference";

export const ARENA_BASE = "/arena";

export function arenaLandingPath() {
  return ARENA_BASE;
}

export function arenaTablePath(metaGame, tableId) {
  return `${ARENA_BASE}/table/${encodeURIComponent(metaGame)}/${encodeURIComponent(tableId)}`;
}

export function arenaPlayPath(metaGame, gameId, { layout } = {}) {
  const base = `${ARENA_BASE}/play/${encodeURIComponent(metaGame)}/${encodeURIComponent(gameId)}`;
  return appendLayoutQuery(base, layout);
}

export function arenaWatchPath(metaGame, gameId, { layout } = {}) {
  const base = `${ARENA_BASE}/watch/${encodeURIComponent(metaGame)}/${encodeURIComponent(gameId)}`;
  return appendLayoutQuery(base, layout);
}

export function isArenaPath(pathname = "") {
  return pathname === ARENA_BASE || pathname.startsWith(`${ARENA_BASE}/`);
}
