import {
  validateRenderCustomization,
} from "@abstractplay/renderer";
import { normalizeCustomizationSettings } from "./normalizeCustomizationSettings.js";

/** Suggested range for the Customize label-scale slider only (not a validation cap). */
export const LABEL_SCALE_SLIDER_MIN = 0.75;
export const LABEL_SCALE_SLIDER_MAX = 3;
export const LABEL_SCALE_SLIDER_STEP = 0.05;

/**
 * @param {unknown} value
 * @returns {number}
 */
export function coerceLabelScale(value) {
  if (value === "" || value === null || value === undefined) {
    return 1;
  }
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) {
    return 1;
  }
  return n;
}

/** Max UTF-8 byte length for stringified `settings.render` on save (bulk apply uses same blob). */
export const MAX_RENDER_SETTINGS_BYTES = 8192;

/**
 * @param {Record<string, unknown> | null | undefined} render
 * @returns {number}
 */
export function renderSettingsByteSize(render) {
  if (!render || typeof render !== "object") {
    return 0;
  }
  return new TextEncoder().encode(JSON.stringify(render)).length;
}

/**
 * @param {Record<string, unknown> | null | undefined} render
 * @returns {boolean}
 */
export function isRenderSettingsWithinSizeLimit(render) {
  return renderSettingsByteSize(render) <= MAX_RENDER_SETTINGS_BYTES;
}

/** Rep `options` keys users may toggle in Customize (order preserved in save). */
export const RENDER_OPTION_WHITELIST = [
  "hide-labels",
  "hide-labels-half",
  "no-border",
  "hide-star-points",
];

/**
 * @param {string[] | null | undefined} options
 * @returns {string[]}
 */
export function filterWhitelistedRenderOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return RENDER_OPTION_WHITELIST.filter((key) => options.includes(key));
}

/**
 * @typedef {{
 *   boardStyle: string;
 *   strokeWeight: string | number;
 *   labelScale: string | number;
 *   renderOptions: string[];
 *   glyphMap: unknown[][];
 * }} CustomizeRenderUiState
 */

/**
 * @param {Record<string, unknown> | null | undefined} settings
 * @param {import('@abstractplay/gameslib').APRenderRep | null | undefined} [previewRep]
 * @returns {CustomizeRenderUiState}
 */
export function renderUiStateFromSettings(settings, previewRep = null) {
  const norm = normalizeCustomizationSettings(settings);
  const board = norm.board ?? {};
  const savedOptions = filterWhitelistedRenderOptions(norm.options);
  const renderOptions =
    savedOptions.length > 0
      ? savedOptions
      : filterWhitelistedRenderOptions(previewRep?.options);

  return {
    boardStyle:
      board.style !== undefined && board.style !== null
        ? String(board.style)
        : "",
    strokeWeight:
      board.strokeWeight !== undefined && board.strokeWeight !== null
        ? board.strokeWeight
        : "",
    labelScale: coerceLabelScale(board.labelScale),
    renderOptions,
    glyphMap: Array.isArray(norm.glyphmap) ? [...norm.glyphmap] : [],
  };
}

/**
 * @param {CustomizeRenderUiState} state
 * @returns {Record<string, unknown> | null}
 */
export function buildRenderCustomization(state) {
  const { boardStyle, strokeWeight, labelScale, renderOptions, glyphMap } =
    state;
  const render = {};
  const board = {};

  if (boardStyle) {
    board.style = boardStyle;
  }
  if (strokeWeight !== "" && strokeWeight !== null && strokeWeight !== undefined) {
    const w = Number(strokeWeight);
    if (!Number.isNaN(w)) {
      board.strokeWeight = w;
    }
  }
  const ls = coerceLabelScale(labelScale);
  if (ls !== 1) {
    board.labelScale = ls;
  }

  if (Object.keys(board).length > 0) {
    render.board = board;
  }
  const options = filterWhitelistedRenderOptions(renderOptions);
  if (options.length > 0) {
    render.options = options;
  }
  if (glyphMap.length > 0) {
    render.glyphmap = glyphMap.map((row) => [...row]);
  }

  return Object.keys(render).length > 0 ? render : null;
}

/**
 * Global `_default` customizations must not set `board.style` (topology differs per game).
 *
 * @param {Record<string, unknown> | null | undefined} render
 * @returns {Record<string, unknown> | null}
 */
export function stripBoardStyleForGlobalRender(render) {
  if (!render || typeof render !== "object") {
    return null;
  }
  const board = render.board;
  if (!board || typeof board !== "object" || board.style === undefined) {
    return Object.keys(render).length > 0 ? render : null;
  }
  const nextBoard = { ...board };
  delete nextBoard.style;
  const next = { ...render };
  if (Object.keys(nextBoard).length > 0) {
    next.board = nextBoard;
  } else {
    delete next.board;
  }
  return Object.keys(next).length > 0 ? next : null;
}

/**
 * @param {import('@abstractplay/gameslib').APRenderRep} rep
 * @param {Record<string, unknown> | null} render
 */
export function preflightRenderCustomization(rep, render) {
  if (!render || typeof render !== "object") {
    return { ok: true, errors: [], warnings: [] };
  }
  const board =
    render.board && typeof render.board === "object"
      ? { ...render.board }
      : {};
  if (Array.isArray(render.options) && render.options.length > 0) {
    board.options = render.options;
  }
  const hasBoardKeys = Object.keys(board).some((k) => k !== "options");
  const hasOptions = Array.isArray(board.options) && board.options.length > 0;
  if (!hasBoardKeys && !hasOptions) {
    return { ok: true, errors: [], warnings: [] };
  }
  const result = validateRenderCustomization(rep, board);
  return {
    ok: result.ok,
    errors: result.errors ?? [],
    warnings: result.warnings ?? [],
  };
}

/** Clears board/options overrides; keeps glyph map. */
export function clearBoardRenderUi(state, previewRep = null) {
  return {
    ...state,
    boardStyle: "",
    strokeWeight: "",
    labelScale: 1,
    renderOptions: filterWhitelistedRenderOptions(previewRep?.options),
  };
}
