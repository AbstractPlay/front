import {
  validateRenderCustomization,
} from "@abstractplay/renderer";
import { normalizeCustomizationSettings } from "./normalizeCustomizationSettings.js";

function scopeSettings(globalMe, metaGame) {
  const perGame = globalMe?.customizations?.[metaGame];
  if (perGame) {
    return perGame;
  }
  return globalMe?.customizations?._default ?? null;
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
  let board = norm.board;
  let options = norm.options;

  if (rep && (board || options)) {
    const chrome = board ? { ...board } : {};
    if (options) {
      chrome.options = options;
    }
    const result = validateRenderCustomization(rep, chrome);
    if (!result.ok) {
      board = null;
      options = null;
    }
  }

  return { board, glyphmap, options };
}
