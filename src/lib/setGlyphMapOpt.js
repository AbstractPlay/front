import { resolveEffectiveRenderSettings } from "./resolveEffectiveRenderSettings.js";

export const setGlyphMapOpt = ({
  options,
  metaGame,
  globalMe,
  renderRep = null,
}) => {
  const { glyphmap } = resolveEffectiveRenderSettings(
    globalMe,
    metaGame,
    renderRep,
  );
  if (glyphmap.length > 0) {
    options.glyphmap = [...glyphmap];
  }
};
