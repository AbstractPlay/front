import {
  applyBoardChrome,
  sanitizeRenderRep,
  getCompatibleStyles,
  isBoardChromeEligible,
} from "@abstractplay/renderer";
import {
  isBoardBasicBoard,
  isBoardStyleSwappable,
} from "./boardRepShape.js";
import { resolveEffectiveRenderSettings } from "./resolveEffectiveRenderSettings.js";

/**
 * @param {Record<string, unknown>} board
 * @param {import('@abstractplay/gameslib').APRenderRep} rawRep
 */
function boardChromePatchForRep(board, rawRep) {
  const patch = { ...board };
  if (patch.style === undefined) {
    return patch;
  }
  const baseStyle =
    rawRep.board && "style" in rawRep.board
      ? String(rawRep.board.style)
      : null;
  if (!baseStyle) {
    delete patch.style;
    return patch;
  }
  const target = String(patch.style);
  const styleAllowed =
    isBoardStyleSwappable(rawRep) &&
    isBoardChromeEligible(rawRep) &&
    target !== baseStyle &&
    getCompatibleStyles(baseStyle).includes(target);
  const styleNoOp = target === baseStyle;
  if (!styleNoOp && !styleAllowed) {
    delete patch.style;
  }
  return patch;
}

/**
 * @param {import('@abstractplay/gameslib').APRenderRep | import('@abstractplay/gameslib').APRenderRep[] | null | undefined} rawRep
 * @param {{ board: Record<string, unknown> | null, options?: string[] | null } | null | undefined} renderSettings
 */
export function getDisplayRenderRep(rawRep, renderSettings) {
  if (rawRep == null) {
    return rawRep;
  }
  if (Array.isArray(rawRep)) {
    return rawRep.map((r) => getDisplayRenderRep(r, renderSettings));
  }

  const board = renderSettings?.board;
  const options = renderSettings?.options;
  const hasOptions = Array.isArray(options) && options.length > 0;
  const hasBoard = board && Object.keys(board).length > 0;

  if (!hasBoard && !hasOptions) {
    return rawRep;
  }

  if (hasBoard && isBoardBasicBoard(rawRep.board)) {
    const patch = boardChromePatchForRep(board, rawRep);
    const chrome = { ...patch };
    if (hasOptions) {
      chrome.options = options;
    }
    const boardKeys = Object.keys(chrome).filter((k) => k !== "options");
    if (boardKeys.length > 0 || hasOptions) {
      const merged = applyBoardChrome(rawRep, chrome);
      return sanitizeRenderRep(merged);
    }
  }

  if (hasOptions) {
    const merged = applyBoardChrome(rawRep, { options });
    return sanitizeRenderRep(merged);
  }

  return rawRep;
}

/**
 * @param {import('@abstractplay/gameslib').APRenderRep | import('@abstractplay/gameslib').APRenderRep[] | null | undefined} rawRep
 * @param {object | null | undefined} globalMe
 * @param {string} metaGame
 */
export function resolveDisplayRenderRep(rawRep, globalMe, metaGame) {
  if (rawRep == null) {
    return rawRep;
  }
  if (Array.isArray(rawRep)) {
    return rawRep.map((r) => {
      const settings = resolveEffectiveRenderSettings(globalMe, metaGame, r);
      return getDisplayRenderRep(r, settings);
    });
  }
  const settings = resolveEffectiveRenderSettings(globalMe, metaGame, rawRep);
  return getDisplayRenderRep(rawRep, settings);
}
