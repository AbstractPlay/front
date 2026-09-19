/**
 * Normalize legacy customization blobs to render.* fields.
 *
 * @param {Record<string, unknown> | null | undefined} settings
 * @returns {{ board: Record<string, unknown> | null, glyphmap: unknown[], options: string[] | null }}
 */
export function normalizeCustomizationSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return { board: null, glyphmap: [], options: null };
  }

  const render =
    settings.render && typeof settings.render === "object"
      ? settings.render
      : {};

  const glyphmap = Array.isArray(render.glyphmap)
    ? [...render.glyphmap]
    : Array.isArray(settings.glyphmap)
      ? [...settings.glyphmap]
      : [];

  let board = null;
  if (render.board && typeof render.board === "object") {
    board = { ...render.board };
  } else if (
    settings.boardChrome &&
    typeof settings.boardChrome === "object"
  ) {
    board = { ...settings.boardChrome };
  }

  const options = Array.isArray(render.options) ? [...render.options] : null;

  return { board, glyphmap, options };
}

/**
 * Deep-clone the `render` subtree for bulk apply (prefers saved `render`, else legacy fields).
 *
 * @param {Record<string, unknown> | null | undefined} settings
 * @returns {Record<string, unknown> | null}
 */
export function cloneRenderCustomization(settings) {
  if (settings?.render && typeof settings.render === "object") {
    const render = settings.render;
    return JSON.parse(JSON.stringify(render));
  }

  const norm = normalizeCustomizationSettings(settings);
  const render = {};

  if (norm.board && Object.keys(norm.board).length > 0) {
    render.board = { ...norm.board };
  }
  if (norm.glyphmap.length > 0) {
    render.glyphmap = norm.glyphmap.map((row) => [...row]);
  }
  if (norm.options && norm.options.length > 0) {
    render.options = [...norm.options];
  }

  return Object.keys(render).length > 0 ? render : null;
}
