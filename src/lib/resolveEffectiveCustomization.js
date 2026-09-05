/**
 * Resolve per-game vs global customization scope (mirrors setRendererColourOpts).
 */

export function resolveCustomizationScope(globalMe, metaGame) {
  const result = {
    palette: null,
    colourContext: null,
    glyphmap: null,
    coloursGlobal: true,
    contextGlobal: true,
  };

  const perGame = globalMe?.customizations?.[metaGame];
  if (perGame) {
    if (
      perGame.palette &&
      Array.isArray(perGame.palette) &&
      perGame.palette.length > 0
    ) {
      result.palette = [...perGame.palette];
      result.coloursGlobal = false;
    }
    if (perGame.colourContext) {
      result.colourContext = perGame.colourContext;
    }
    if (
      perGame.glyphmap &&
      Array.isArray(perGame.glyphmap) &&
      perGame.glyphmap.length > 0
    ) {
      result.glyphmap = [...perGame.glyphmap];
    }
    result.contextGlobal = false;
    return result;
  }

  const global = globalMe?.customizations?._default;
  if (global) {
    if (
      global.palette &&
      Array.isArray(global.palette) &&
      global.palette.length > 0
    ) {
      result.palette = [...global.palette];
      result.coloursGlobal = true;
    }
    if (global.colourContext) {
      result.colourContext = global.colourContext;
    }
    if (
      global.glyphmap &&
      Array.isArray(global.glyphmap) &&
      global.glyphmap.length > 0
    ) {
      result.glyphmap = [...global.glyphmap];
    }
    result.contextGlobal = true;
  }

  return result;
}

/**
 * Per-game preferredColour when set; otherwise inherit from _default.
 */
export function resolvePreferredColour(globalMe, metaGame) {
  const perGame = globalMe?.customizations?.[metaGame];
  const global = globalMe?.customizations?._default;
  if (perGame?.preferredColour != null && perGame.preferredColour !== "") {
    return perGame.preferredColour;
  }
  return global?.preferredColour ?? null;
}
