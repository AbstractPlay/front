import {
  gameinfo,
  sanitizeInputModeForGame,
} from "@abstractplay/gameslib";

function getSetting(setting, deflt, gameSettings, userSettings, metaGame) {
  if (gameSettings !== undefined && gameSettings[setting] !== undefined) {
    return gameSettings[setting];
  }
  if (userSettings !== undefined) {
    if (
      userSettings[metaGame] !== undefined &&
      userSettings[metaGame][setting] !== undefined
    ) {
      return userSettings[metaGame][setting];
    }
    if (
      userSettings.all !== undefined &&
      userSettings.all[setting] !== undefined
    ) {
      return userSettings.all[setting];
    }
    return deflt;
  }
  return deflt;
}

/**
 * Effective input mode uid for handleClick ui, or undefined when the game has none.
 * @param {Record<string, unknown> | undefined} gameSettings
 * @param {Record<string, unknown> | undefined} userSettings
 * @param {string} metaGame
 */
export function resolveInputMode(gameSettings, userSettings, metaGame) {
  const defs = gameinfo.get(metaGame)?.inputModes;
  if (!defs?.length) {
    return undefined;
  }
  const raw = getSetting(
    "inputMode",
    undefined,
    gameSettings,
    userSettings,
    metaGame,
  );
  return sanitizeInputModeForGame(defs, raw);
}
