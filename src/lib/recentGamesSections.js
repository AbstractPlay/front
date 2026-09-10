import { gameinfo } from "@abstractplay/gameslib";

export const RECENT_GAMES_DAY_OPTIONS = [7, 30, 90];

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
