import { gameinfo } from "@abstractplay/gameslib";
import { resolveCustomizationScope } from "./resolveEffectiveCustomization.js";
import { resolveEffectivePalette } from "./resolveEffectivePalette.js";

export const setRendererColourOpts = ({
  options,
  metaGame,
  isParticipant,
  settings,
  context,
  globalMe,
  engine,
  numPlayers,
  customizationHints = gameinfo.get(metaGame)?.customizations,
}) => {
  options.colourContext = context;
  let optioncolours = [];
  // deprecated in favour of explicit customizations
  // option will be removed at some point
  if (settings.color === "blind") {
    options.colourBlind = true;
  }
  // deprecated in favour of explicit customizations
  // named palettes will be removed at some point
  if (settings.color !== "standard" && settings.color !== "blind") {
    console.log(`Looking for a palette named ${settings.color}`);
    const palette = globalMe.palettes?.find((p) => p.name === settings.color);
    if (palette !== undefined) {
      optioncolours = [...palette.colours];
    }
    options.coloursGlobal = false;
  }

  const scope = resolveCustomizationScope(globalMe, metaGame);
  if (globalMe?.customizations?.[metaGame]) {
    options.contextGlobal = false;
  } else if (globalMe?.customizations?._default) {
    options.contextGlobal = true;
  }

  if (scope.palette) {
    const effective = resolveEffectivePalette({
      globalMe,
      metaGame,
      isParticipant,
      engine,
      numPlayers,
      customizationHints,
    });
    if (effective) {
      optioncolours = effective;
      options.coloursGlobal = scope.coloursGlobal;
    }
  }

  if (optioncolours.length > 0 && optioncolours.length < 12) {
    while (optioncolours.length < 12) {
      optioncolours.push(null);
    }
  }
  if (optioncolours.length > 0) {
    options.colours = [...optioncolours];
  }
};
