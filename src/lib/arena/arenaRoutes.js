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

/** Query keys preserved when redirecting `/move/...` → `/arena/play/...`. */
export const ARENA_LEGACY_MOVE_SEARCH_KEYS = ["move", "nodeid", "replay"];

/**
 * Canonical arena play URL when replacing a legacy `/move/:meta/:cbits/:id` link.
 * Merges exploration/replay params from the old search string with arena layout.
 */
export function arenaPlayPathFromLegacyMove(
  metaGame,
  gameId,
  { layout, search = "" } = {},
) {
  const withLayout = arenaPlayPath(metaGame, gameId, { layout });
  const qIndex = withLayout.indexOf("?");
  const pathname = qIndex === -1 ? withLayout : withLayout.slice(0, qIndex);
  const params = new URLSearchParams(
    qIndex === -1 ? "" : withLayout.slice(qIndex + 1),
  );
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const incoming = new URLSearchParams(raw);
  for (const key of ARENA_LEGACY_MOVE_SEARCH_KEYS) {
    const value = incoming.get(key);
    if (value !== null && value !== "") {
      params.set(key, value);
    }
  }
  const merged = params.toString();
  return merged ? `${pathname}?${merged}` : pathname;
}

/** Stable query comparison (ignores param order). */
export function normalizePlaySearch(search = "") {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) {
    return "";
  }
  const params = new URLSearchParams(raw);
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function playLocationMatchesTarget(pathname, search, targetFull) {
  const qIndex = targetFull.indexOf("?");
  const targetPath = qIndex === -1 ? targetFull : targetFull.slice(0, qIndex);
  if (pathname !== targetPath) {
    return false;
  }
  const targetSearch =
    qIndex === -1 ? "" : `?${targetFull.slice(qIndex + 1)}`;
  return normalizePlaySearch(search) === normalizePlaySearch(targetSearch);
}

export function arenaWatchPath(metaGame, gameId, { layout } = {}) {
  const base = `${ARENA_BASE}/watch/${encodeURIComponent(metaGame)}/${encodeURIComponent(gameId)}`;
  return appendLayoutQuery(base, layout);
}

export function isArenaPath(pathname = "") {
  return pathname === ARENA_BASE || pathname.startsWith(`${ARENA_BASE}/`);
}

export function isSeatedOnArenaTableRow(row, userId) {
  if (!userId || !row?.seatUserIds?.length) {
    return false;
  }
  return row.seatUserIds.includes(userId);
}

/** Open-table list: seated players rejoin live play; others watch or join lobby. */
export function arenaListTableHref(row, userId, { layout } = {}) {
  if (row.state === "playing" && isSeatedOnArenaTableRow(row, userId)) {
    return arenaPlayPath(row.metaGame, row.tableId, { layout });
  }
  if (row.state === "playing") {
    return arenaWatchPath(row.metaGame, row.tableId, { layout });
  }
  return arenaTablePath(row.metaGame, row.tableId);
}
