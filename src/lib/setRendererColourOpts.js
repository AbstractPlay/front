import { gameinfo } from "@abstractplay/gameslib";
import { resolveCustomizationScope, resolvePreferredColour } from "./resolveEffectiveCustomization.js";
import { resolveEffectivePalette } from "./resolveEffectivePalette.js";

export const setRendererColourOpts = ({
  options,
  metaGame,
  isParticipant,
  context,
  globalMe,
  engine,
  numPlayers,
  customizationHints = gameinfo.get(metaGame)?.customizations,
}) => {
  options.colourContext = context;
  let optioncolours = [];

  const scope = resolveCustomizationScope(globalMe, metaGame);
  const hasPerGameCustomization = Boolean(globalMe?.customizations?.[metaGame]);
  if (hasPerGameCustomization) {
    options.contextGlobal = false;
    options.coloursGlobal = false;
  } else if (globalMe?.customizations?._default) {
    options.contextGlobal = true;
    options.coloursGlobal = true;
  }

  if (scope.palette || resolvePreferredColour(globalMe, metaGame)) {
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
