import { gameinfo } from "@abstractplay/gameslib";

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
  return (
    metaGame !== null &&
    metaGame !== undefined &&
    metaGame !== "" &&
    gameinfo.has(metaGame)
  );
}

/** Build list URL: `/recent-games` or `/recent-games/:metaGame`. */
export function recentGamesListPath(metaGame = null) {
  if (isValidRecentGamesMetaGame(metaGame)) {
    return `/recent-games/${metaGame}`;
  }
  return "/recent-games";
}
