import { GameFactory } from "@abstractplay/gameslib";
import { renderglyph } from "@abstractplay/renderer";

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
	let optioncolours = [];
  if (settings.color === "blind") {
    options.colourBlind = true;
    //   } else if (settings.color === "patterns") {
    //     options.patterns = true;
  }
  if (
    settings.color !== "standard" &&
    settings.color !== "blind" &&
    globalMe !== null &&
    globalMe.palettes !== null
  ) {
    const palette = globalMe.palettes.find((p) => p.name === settings.color);
    if (palette !== undefined) {
      optioncolours = [...palette.colours];
    }
  }
  if (globalMe?.customizations?.[game.metaGame]) {
    const custom = globalMe.customizations[game.metaGame];
    if (
      custom.palette &&
      Array.isArray(custom.palette) &&
      custom.palette.length > 0
    ) {
      optioncolours = [...custom.palette];
    }
  } else if (globalMe?.customizations?._default) {
    const custom = globalMe.customizations._default;
    if (
      custom.palette &&
      Array.isArray(custom.palette) &&
      custom.palette.length > 0
    ) {
      optioncolours = [...custom.palette];
    }
  }
  // extend all palettes to 12 colours
  if (
    optioncolours !== undefined &&
    Array.isArray(optioncolours) &&
    optioncolours.length < 12
  ) {
    while (optioncolours.length < 12) {
      optioncolours.push("#fff");
    }
  }
  // handle "Always use my colour" preference
  if (
    optioncolours !== undefined &&
    Array.isArray(optioncolours) &&
    optioncolours.length > 0 &&
    globalMe?.settings?.all?.myColor &&
    game.me > 0
  ) {
    const mycolor = optioncolours.shift();
    optioncolours.splice(game.me, 0, mycolor);
  }
  // set option
  if (optioncolours.length > 0) {
    options.colours = [...optioncolours];
  }
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
