import { resolveEffectiveRenderSettings } from "./resolveEffectiveRenderSettings.js";
import { getDisplayRenderRep } from "./getDisplayRenderRep.js";

/**
 * Resolve customization and merge board chrome for one render rep layer.
 *
 * @returns {{ displayRep: import('@abstractplay/gameslib').APRenderRep, renderSettings: ReturnType<typeof resolveEffectiveRenderSettings> }}
 */
export function prepareBoardRender(rawRep, globalMe, metaGame) {
  const renderSettings = resolveEffectiveRenderSettings(
    globalMe,
    metaGame,
    rawRep,
  );
  const displayRep = getDisplayRenderRep(rawRep, renderSettings);
  return { displayRep, renderSettings };
}

/** Renderer options shared by live board + export paths. */
export function applyRenderSettingsToOptions(options, renderSettings) {
  if (
    renderSettings.glyphmap &&
    Array.isArray(renderSettings.glyphmap) &&
    renderSettings.glyphmap.length > 0
  ) {
    options.glyphmap = [...renderSettings.glyphmap];
  }
  options.sanitizeMode = "live";
}
