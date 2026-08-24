/**
 * Per-game Glicko (`glickoByGame` / `GlickoStats`): prefer exported `ratingLow`.
 * @param {{ rating?: number, rd?: number, ratingLow?: number } | null | undefined} glicko
 */
export function glickoRatingLow(glicko) {
  if (!glicko || glicko.rd == null) {
    return null;
  }
  if (glicko.ratingLow != null) {
    return glicko.ratingLow;
  }
  if (glicko.rating != null) {
    return glicko.rating - 2 * glicko.rd;
  }
  return null;
}

/**
 * Site composite (`glickoSite`): high-confidence bound is rating − 2×rd.
 * @param {{ rating?: number, rd?: number } | null | undefined} siteEntry
 */
export function glickoSiteRatingLow(siteEntry) {
  if (!siteEntry || siteEntry.rd == null || siteEntry.rating == null) {
    return null;
  }
  return siteEntry.rating - 2 * siteEntry.rd;
}

/**
 * @param {{ user: string, game: string, glicko: object }[]} glickoByGame
 */
export function buildGlickoByGameMap(glickoByGame) {
  const map = new Map();
  for (const row of glickoByGame ?? []) {
    map.set(`${row.user}|${row.game}`, row.glicko);
  }
  return map;
}

/**
 * @param {{ rating?: number, rd?: number, ratingLow?: number } | null | undefined} glicko
 */
export function formatGlickoLowWithRd(glicko) {
  const low = glickoRatingLow(glicko);
  if (low == null || glicko?.rd == null) {
    return "---";
  }
  return `${Math.round(low)} (${Math.round(glicko.rd)})`;
}

/**
 * @param {{ rating?: number, rd?: number } | null | undefined} siteEntry
 */
export function formatGlickoSiteLowWithRd(siteEntry) {
  const low = glickoSiteRatingLow(siteEntry);
  if (low == null || siteEntry?.rd == null) {
    return "---";
  }
  return `${Math.round(low)} (${Math.round(siteEntry.rd)})`;
}
