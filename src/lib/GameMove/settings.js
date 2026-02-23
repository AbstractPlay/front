import { GameFactory } from "@abstractplay/gameslib";
import { renderglyph } from "@abstractplay/renderer";
import { setRendererColourOpts } from "../setRendererColourOpts";

function getSetting(setting, deflt, gameSettings, userSettings, metaGame) {
  if (gameSettings !== undefined && gameSettings[setting] !== undefined) {
    return gameSettings[setting];
  } else if (userSettings !== undefined) {
    if (
      userSettings[metaGame] !== undefined &&
      userSettings[metaGame][setting] !== undefined
    ) {
      return userSettings[metaGame][setting];
    } else if (
      userSettings.all !== undefined &&
      userSettings.all[setting] !== undefined
    ) {
      return userSettings.all[setting];
    } else {
      return deflt;
    }
  } else {
    return deflt;
  }
}

export function processNewSettings(
  newGameSettings,
  newUserSettings,
  gameRef,
  settingsSetter,
  gameSettingsSetter,
  userSettingsSetter,
  globalMe,
  colourContext
) {
  gameSettingsSetter(newGameSettings);
  userSettingsSetter(newUserSettings);
  if (gameRef.current !== null) {
    var newSettings = {};
    const game = gameRef.current;
    newSettings.display = getSetting(
      "display",
      undefined,
      newGameSettings,
      newUserSettings,
      game.metaGame
    );
    newSettings.color = getSetting(
      "color",
      "standard",
      newGameSettings,
      newUserSettings,
      game.metaGame
    );
    newSettings.annotate = getSetting(
      "annotate",
      true,
      newGameSettings,
      newUserSettings,
      game.metaGame
    );
    newSettings.rotate =
      newGameSettings === undefined || newGameSettings.rotate === undefined
        ? 0
        : newGameSettings.rotate;
    setupColors(newSettings, game, globalMe, colourContext);
    settingsSetter(newSettings);
    return newSettings;
  }
}

export function setupColors(settings, game, globalMe, colourContext, node) {
  var options = {};
  setRendererColourOpts({options, metaGame: game.metaGame, isParticipant: game.me, settings, context: colourContext, globalMe})
  game.colors = game.players.map((p, i) => {
    if (game.sharedPieces) {
      return { isImage: false, value: game.seatNames[i] };
    } else {
      options.svgid = "player" + i + "color";
      options.colourContext = colourContext;
      let color = i + 1;
      if (game.customColours) {
        let engine;
        if (node === undefined) {
          engine = GameFactory(game.metaGame, game.state);
        } else {
          engine = GameFactory(game.metaGame, node.state);
        }
        color = engine.getPlayerColour(i + 1);
      }
      return {
        isImage: true,
        value: renderglyph("piece", color, options),
      };
    }
  });
}
