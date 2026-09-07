import { useEffect } from "react";
import { resolveEffectiveCustomCss } from "../lib/resolveEffectiveCustomCss.js";

/**
 * Mount per-game custom CSS via adoptedStyleSheets; clears on unmount / game change.
 */
export function useGameCustomCss(metaGame, globalMe, localStorageMap) {
  const resolved = resolveEffectiveCustomCss(globalMe, metaGame, localStorageMap);

  useEffect(() => {
    if (resolved?.active && resolved.css?.trim()) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(resolved.css);
      document.adoptedStyleSheets = [sheet];
    } else {
      document.adoptedStyleSheets = [];
    }

    return () => {
      document.adoptedStyleSheets = [];
    };
  }, [metaGame, resolved?.css, resolved?.active]);

  return resolved;
}
