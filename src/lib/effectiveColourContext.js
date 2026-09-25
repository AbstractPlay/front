import { omitRedundantBoardFromColourContext } from "./omitRedundantBoardFromColourContext.js";

/**
 * Merge zustand colour context (light/dark mode) with user customizations.
 * Per-game customizations override the theme; global _default customizations
 * sit beneath the active theme so light/dark toggles still apply.
 */
export function getEffectiveColourContext(colourContext, globalMe, metaGame) {
  const base = { ...colourContext };
  const gameCustom =
    metaGame && globalMe?.customizations?.[metaGame]?.colourContext;
  if (gameCustom) {
    const sanitized = omitRedundantBoardFromColourContext(gameCustom);
    return { ...base, ...sanitized };
  }
  const defaultCustom = globalMe?.customizations?._default?.colourContext;
  if (defaultCustom) {
    const sanitized = omitRedundantBoardFromColourContext(defaultCustom);
    return { ...sanitized, ...base };
  }
  return base;
}
