import {
  applyBoardChrome,
  sanitizeRenderRep,
  isBoardChromeEligible,
} from "@abstractplay/renderer";
import { resolveEffectiveRenderSettings } from "./resolveEffectiveRenderSettings.js";

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

  if (hasBoard && isBoardChromeEligible(rawRep)) {
    const chrome = { ...board };
    if (hasOptions) {
      chrome.options = options;
    }
    const merged = applyBoardChrome(rawRep, chrome);
    return sanitizeRenderRep(merged);
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
