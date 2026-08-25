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

/**
 * Compare two Glicko objects by conservative low bound (ascending).
 * @param {{ rating?: number, rd?: number, ratingLow?: number } | null | undefined} glickoA
 * @param {{ rating?: number, rd?: number, ratingLow?: number } | null | undefined} glickoB
 */
export function compareByGlickoLow(glickoA, glickoB) {
  const lowA = glickoRatingLow(glickoA) ?? -Infinity;
  const lowB = glickoRatingLow(glickoB) ?? -Infinity;
  if (lowA !== lowB) {
    return lowA - lowB;
  }
  const rdA = glickoA?.rd ?? 0;
  const rdB = glickoB?.rd ?? 0;
  return rdA - rdB;
}

/**
 * 95% confidence range for per-game Glicko display.
 * @param {{ rating?: number, rd?: number } | null | undefined} glicko
 */
export function formatGlickoConfidenceRange(glicko) {
  if (!glicko || glicko.rating == null || glicko.rd == null) {
    return "---";
  }
  const min = Math.round(glicko.rating - glicko.rd * 2);
  const max = Math.round(glicko.rating + glicko.rd * 2);
  return `${min}–${max}`;
}

/**
 * TanStack Table sortingFn for a Glicko object column.
 */
export function glickoColumnSortingFn(rowA, rowB, columnID) {
  return compareByGlickoLow(rowA.getValue(columnID), rowB.getValue(columnID));
}

/**
 * Rank within a game label by conservative Glicko (1-based).
 * @param {{ user: string, game: string, glicko?: object }[]} highest
 * @param {string} game
 * @param {string} userId
 */
export function rankAmongGameByGlickoLow(highest, game, userId) {
  const rows = highest
    .filter((r) => r.game === game)
    .sort((a, b) => -compareByGlickoLow(a.glicko, b.glicko));
  const idx = rows.findIndex((r) => r.user === userId);
  return idx >= 0 ? idx + 1 : 0;
}
