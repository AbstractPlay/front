/**
 * Merge selected customization sections from source into target settings.
 * Used by bulk-apply; only overwrites sections the user selected.
 */

/**
 * @typedef {object} CustomizationSections
 * @property {boolean} [palette]
 * @property {boolean} [colourContext]
 * @property {boolean} [glyphmap]
 * @property {boolean} [preferredColour]
 * @property {boolean} [customCss]
 */

/**
 * @param {Record<string, unknown>} target
 * @param {Record<string, unknown>} source
 * @param {CustomizationSections} sections
 * @returns {Record<string, unknown>}
 */
export function mergeCustomizationSections(target, source, sections) {
  const out = { ...target };

  if (sections.palette) {
    out.palette = Array.isArray(source.palette) ? [...source.palette] : [];
  }
  if (sections.colourContext) {
    out.colourContext =
      source.colourContext && typeof source.colourContext === "object"
        ? { ...source.colourContext }
        : {};
  }
  if (sections.glyphmap) {
    out.glyphmap = Array.isArray(source.glyphmap) ? [...source.glyphmap] : [];
  }
  if (sections.preferredColour) {
    if (source.preferredColour != null && source.preferredColour !== "") {
      out.preferredColour = source.preferredColour;
    } else {
      delete out.preferredColour;
    }
  }
  if (sections.customCss) {
    if (source.customCss && typeof source.customCss === "object") {
      out.customCss = { ...source.customCss };
    } else {
      delete out.customCss;
    }
  }

  return out;
}

/** Default section flags for bulk apply (all on). */
export const ALL_CUSTOMIZATION_SECTIONS = {
  palette: true,
  colourContext: true,
  glyphmap: true,
  preferredColour: true,
  customCss: true,
};
