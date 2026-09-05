import { gameinfo } from "@abstractplay/gameslib";
import { setRendererColourOpts } from "../setRendererColourOpts";
import { setGlyphMapOpt } from "../setGlyphMapOpt";

/**
 * Build renderer options for export (mirrors session render recipes, no interactivity).
 * No engine is available — player slot resolution uses gameinfo hints + viewerSeat.
 */
export function buildBoardRenderOptions({
  metaGame,
  settings,
  colourContext,
  globalMe,
  isParticipant,
  viewerSeat,
  numPlayers,
  customizationHints = gameinfo.get(metaGame)?.customizations,
}) {
  const seat = viewerSeat ?? isParticipant;
  const options = {
    svgid: "theBoardSVG",
    rotate: settings?.rotate,
    showAnnotations: settings?.annotate,
  };
  setRendererColourOpts({
    options,
    metaGame,
    isParticipant: seat,
    settings,
    context: colourContext,
    globalMe,
    numPlayers,
    customizationHints,
  });
  setGlyphMapOpt({
    options,
    metaGame,
    globalMe,
  });
  return options;
}
