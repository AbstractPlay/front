import { gameinfo } from "@abstractplay/gameslib";
import { setRendererColourOpts } from "../setRendererColourOpts";
import { setGlyphMapOpt } from "../setGlyphMapOpt";
import {
  applyRenderSettingsToOptions,
  prepareBoardRender,
} from "../prepareBoardRender";

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
  renderRep = null,
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
    context: colourContext,
    globalMe,
    numPlayers,
    customizationHints,
  });
  if (renderRep) {
    const { renderSettings } = prepareBoardRender(renderRep, globalMe, metaGame);
    setGlyphMapOpt({
      options,
      metaGame,
      globalMe,
      renderRep,
    });
    applyRenderSettingsToOptions(options, renderSettings);
  } else {
    setGlyphMapOpt({
      options,
      metaGame,
      globalMe,
    });
  }
  return options;
}
