import { resolveMetaGameUid } from "./gameOptions";

export const RECENT_GAMES_DAY_OPTIONS = [7, 30];
export const RECENT_GAMES_DEFAULT_DAYS = 7;

/**
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeRecentGamesDays(value) {
  const n = Number(value);
  if (n === 90 || !RECENT_GAMES_DAY_OPTIONS.includes(n)) {
    return RECENT_GAMES_DEFAULT_DAYS;
  }
  return n;
}

export function isValidRecentGamesMetaGame(metaGame) {
  return resolveMetaGameUid(metaGame) !== undefined;
}

/** Build list URL: `/recent-games` or `/recent-games/:metaGame`. */
export function recentGamesListPath(metaGame = null) {
  const resolved = resolveMetaGameUid(metaGame);
  if (resolved !== undefined) {
    return `/recent-games/${resolved}`;
  }
  return "/recent-games";
}
