import { GameFactory } from "@abstractplay/gameslib";
import { isStructuredRenderLabel } from "@abstractplay/gameslib";
import {
  renderLegendGlyph,
  renderSheetGlyph,
} from "@abstractplay/renderer";
import { setGlyphMapOpt } from "./setGlyphMapOpt.js";
import { setRendererColourOpts } from "./setRendererColourOpts.js";

/**
 * True when a sidebar status/score cell value should be rendered as an inline glyph,
 * not passed through i18n / RenderLabel resolution.
 */
export function isStatusGlyphLike(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (isStructuredRenderLabel(value)) {
    return false;
  }
  if (value.kind === "sheet" || value.kind === "legend") {
    return true;
  }
  if ("glyph" in value && "colour" in value) {
    return true;
  }
  if ("piece" in value) {
    return true;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return false;
    }
    if (Array.isArray(value[0])) {
      return true;
    }
    const first = value[0];
    return (
      typeof first === "object" &&
      first !== null &&
      "name" in first &&
      typeof first.name === "string"
    );
  }
  return "name" in value && typeof value.name === "string";
}

function legendEntryFromStatusValue(value) {
  if (value.kind === "legend") {
    return value.entry;
  }
  if (value.kind === "sheet") {
    return { name: value.name, colour: value.colour };
  }
  if ("glyph" in value && "colour" in value) {
    const g = value.glyph;
    if (typeof g === "string") {
      return { name: g, colour: value.colour };
    }
    if (typeof g === "object" && g !== null) {
      return { ...g, colour: value.colour ?? g.colour };
    }
  }
  return value;
}

export function buildStatusGlyphRenderOptions({
  id,
  game,
  globalMe,
  colourContext,
}) {
  const options = { svgid: id };
  let engine;
  if (game.customColours && game.state) {
    engine = GameFactory(game.metaGame, game.state);
  }
  setRendererColourOpts({
    options,
    metaGame: game.metaGame,
    isParticipant: game.me,
    context: colourContext,
    globalMe,
    engine,
    numPlayers: game.players?.length,
  });
  setGlyphMapOpt({
    options,
    metaGame: game.metaGame,
    globalMe,
    renderRep: game.renderRep ?? null,
  });
  return options;
}

/**
 * @returns {string} SVG markup for a sidebar status/score/stash glyph value.
 */
export function renderStatusGlyphSvg(value, options) {
  if (value.kind === "sheet") {
    return renderSheetGlyph(value.name, value.colour, options);
  }
  if ("glyph" in value && typeof value.glyph === "string" && "colour" in value) {
    return renderSheetGlyph(value.glyph, value.colour, options);
  }
  return renderLegendGlyph(legendEntryFromStatusValue(value), options);
}

export function statusGlyphAlt(value) {
  if (typeof value === "object" && value !== null && "colour" in value) {
    return `color ${value.colour}`;
  }
  return "";
}

/**
 * Maps `IStashEntry.glyph` to the same shapes `renderStatusGlyphSvg` accepts.
 */
export function stashEntryToStatusGlyph(stashItem) {
  const g = stashItem.glyph;
  if (g === null || typeof g !== "object") {
    return g;
  }
  if (g.kind === "sheet" || g.kind === "legend") {
    return g;
  }
  if (Array.isArray(g) || "piece" in g) {
    return g;
  }
  if ("glyph" in g && typeof g.glyph === "string" && "colour" in g) {
    return g;
  }
  if (typeof g.name === "string" && g.colour !== undefined) {
    return { kind: "sheet", name: g.name, colour: g.colour };
  }
  if (isStatusGlyphLike(g)) {
    return g;
  }
  return g;
}
