import { gameinfo, GameFactory } from "@abstractplay/gameslib";

/** Localized markdown description; call during render so language/bundle updates apply. */
export function gameDescription(metaGame) {
  const info = gameinfo.get(metaGame);
  if (!info) {
    return "";
  }
  const gameEngine =
    info.playercounts && info.playercounts.length > 1
      ? GameFactory(metaGame, 2)
      : GameFactory(metaGame);
  return gameEngine.description();
}
