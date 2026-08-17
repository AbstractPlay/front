import { setRendererColourOpts } from "../setRendererColourOpts";
import { setGlyphMapOpt } from "../setGlyphMapOpt";

/**
 * Build renderer options for export (mirrors session render recipes, no interactivity).
 */
export function buildBoardRenderOptions({
  metaGame,
  settings,
  colourContext,
  globalMe,
  isParticipant,
}) {
  const options = {
    svgid: "theBoardSVG",
    rotate: settings?.rotate,
    showAnnotations: settings?.annotate,
  };
  setRendererColourOpts({
    options,
    metaGame,
    isParticipant,
    settings,
    context: colourContext,
    globalMe,
  });
  setGlyphMapOpt({
    options,
    metaGame,
    globalMe,
  });
  return options;
}
