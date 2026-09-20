import {
  getCompatibleStyles,
  isBoardChromeEligible,
  validateRenderCustomization,
} from "@abstractplay/renderer";
import { isBoardStyleSwappable } from "./boardRepShape.js";
import { normalizeCustomizationSettings } from "./normalizeCustomizationSettings.js";

function scopeSettings(globalMe, metaGame) {
  const perGame = globalMe?.customizations?.[metaGame];
  if (perGame) {
    return perGame;
  }
  return globalMe?.customizations?._default ?? null;
}

/**
 * @param {Record<string, unknown>} board
 * @param {import('@abstractplay/gameslib').APRenderRep} rep
 * @returns {Record<string, unknown> | null}
 */
function stripDisallowedBoardStyle(board, rep) {
  if (board.style === undefined) {
    return board;
  }
  const baseStyle =
    rep.board && "style" in rep.board ? String(rep.board.style) : null;
  if (!baseStyle) {
    const { style, ...rest } = board;
    return rest;
  }
  const target = String(board.style);
  if (target === baseStyle) {
    const { style, ...rest } = board;
    return rest;
  }
  const allowed =
    isBoardStyleSwappable(rep) &&
    isBoardChromeEligible(rep) &&
    getCompatibleStyles(baseStyle).includes(target);
  if (!allowed) {
    const { style, ...rest } = board;
    return rest;
  }
  return board;
}

function resolveBoardChromeForRep(board, rep) {
  let candidate = stripDisallowedBoardStyle({ ...board }, rep);

  if (Object.keys(candidate).length === 0) {
    return null;
  }

  let result = validateRenderCustomization(rep, candidate);
  if (!result.ok && candidate.style !== undefined) {
    const { style, ...rest } = candidate;
    candidate = rest;
    if (Object.keys(candidate).length === 0) {
      return null;
    }
    result = validateRenderCustomization(rep, candidate);
  }

  return result.ok ? candidate : null;
}

/**
 * @param {object | null | undefined} globalMe
 * @param {string} metaGame
 * @param {import('@abstractplay/gameslib').APRenderRep | null | undefined} rep
 * @returns {{ board: Record<string, unknown> | null, glyphmap: unknown[], options: string[] | null }}
 */
export function resolveEffectiveRenderSettings(globalMe, metaGame, rep) {
  const norm = normalizeCustomizationSettings(scopeSettings(globalMe, metaGame));
  const glyphmap = norm.glyphmap;
  let board = norm.board ? { ...norm.board } : null;
  let options = norm.options;

  if (rep && board) {
    board = resolveBoardChromeForRep(board, rep);
  }

  if (rep && options?.length) {
    const result = validateRenderCustomization(rep, { options });
    if (!result.ok) {
      options = null;
    }
  }

  return { board, glyphmap, options };
}
