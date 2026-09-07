import { gameinfo, resolveGameName } from "@abstractplay/gameslib";
import { compareStrings } from "./compareStrings";
import { isLabSupportedGame } from "./Lab/buildGame";
import { isProductionMode } from "./realMode";
import { tournamentPlaySupported } from "./tournamentGame";

/**
 * @param {{ flags?: string[] } | null | undefined} info
 */
export function isExperimentalGame(info) {
  return info?.flags?.includes("experimental") ?? false;
}

/**
 * Production backstop when gameslib still ships experimental entries.
 * @param {{ flags?: string[] } | null | undefined} info
 */
export function isPublicCatalogGame(info) {
  if (!info) {
    return false;
  }
  return !(isProductionMode() && isExperimentalGame(info));
}

/** Display name for a meta uid; safe when the game is absent from gameslib. */
export function getGameDisplayName(metaUid, fallback = metaUid) {
  if (!metaUid) {
    return "Unknown";
  }
  const info = gameinfo.get(metaUid);
  return resolveGameName(metaUid, info?.name ?? fallback) || "Unknown";
}

/**
 * Resolve a URL path segment to the canonical meta-game uid (case-insensitive).
 * Returns undefined when no catalog entry matches.
 */
export function resolveMetaGameUid(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (gameinfo.has(raw)) {
    return raw;
  }
  const lower = String(raw).toLowerCase();
  for (const id of gameinfo.keys()) {
    if (id.toLowerCase() === lower) {
      return id;
    }
  }
  return undefined;
}

/** Meta-game uids listed in public catalog UIs. */
export function listPublicCatalogMetas() {
  return [...gameinfo.keys()].filter((id) =>
    isPublicCatalogGame(gameinfo.get(id))
  );
}

export function categoryTagPriority(raw) {
  if (raw.startsWith("goal")) return 1;
  if (raw.startsWith("mech")) return 2;
  if (raw.startsWith("board>shape")) return 3.1;
  if (raw.startsWith("board>connect")) return 3.2;
  if (/^board>[^>]+$/.test(raw)) return 3.05;
  if (raw.startsWith("board")) return 3;
  return 4;
}

export function tagSortFn(a, b, locale = "en") {
  const va = categoryTagPriority(a);
  const vb = categoryTagPriority(b);
  return va === vb ? compareStrings(a, b, locale) : va - vb;
}

/** Sort { raw, tag } category entries by group priority then translated tag label. */
export function compareCategoryTagEntries(a, b, locale = "en") {
  const va = categoryTagPriority(a.raw);
  const vb = categoryTagPriority(b.raw);
  return va === vb
    ? compareStrings(a.tag, b.tag, locale)
    : va - vb;
}

/**
 * Sort raw category keys by group priority, then by a locale-aware display label.
 * @param {string[]} keys
 * @param {string} locale
 * @param {(key: string) => string} labelFor
 */
export function sortCategoryKeys(keys, locale, labelFor) {
  return [...keys].sort((a, b) => {
    const va = categoryTagPriority(a);
    const vb = categoryTagPriority(b);
    return va === vb
      ? compareStrings(labelFor(a), labelFor(b), locale)
      : va - vb;
  });
}

/** Direct board tags (e.g. board>dynamic, board>none), not shape/connect subtrees. */
export function isBoardRootCategory(cat) {
  return (
    /^board>[^>]+$/.test(cat) &&
    !cat.startsWith("board>shape") &&
    !cat.startsWith("board>connect")
  );
}

export function isBoardShapeCategory(cat) {
  return cat.startsWith("board>shape");
}

/** Shape tags plus root board tags — used for the board filter dropdown. */
export function isBoardFilterCategory(cat) {
  return isBoardShapeCategory(cat) || isBoardRootCategory(cat);
}

/**
 * @param {{ labOnly?: boolean, tournamentOnly?: boolean, locale?: string }} options
 * @returns {{ id: string, name: string }[]}
 */
export function buildGameOptions({
  labOnly = false,
  tournamentOnly = false,
  locale = "en",
} = {}) {
  const options = [];
  for (const info of gameinfo.values()) {
    if (!isPublicCatalogGame(info)) {
      continue;
    }
    if (labOnly && !isLabSupportedGame(info.uid)) {
      continue;
    }
    if (tournamentOnly && !tournamentPlaySupported(info.uid)) {
      continue;
    }
    options.push({ id: info.uid, name: getGameDisplayName(info.uid) });
  }
  options.sort((a, b) => compareStrings(a.name, b.name, locale));
  return options;
}

/**
 * @param {{ labOnly?: boolean }} options
 * @returns {{ id: string, name: string } | null}
 */
export function pickRandomGameOption({ labOnly = false } = {}) {
  const options = buildGameOptions({ labOnly });
  if (options.length === 0) {
    return null;
  }
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * @param {{ labOnly?: boolean, tournamentOnly?: boolean, locale?: string }} options
 * @returns {Array<{
 *   id: string,
 *   name: string,
 *   designers: string,
 *   designerList: object[],
 *   categories: string[],
 *   goalTags: string[],
 *   boardShapeTags: string[],
 * }>}
 */
export function buildGameBrowseEntries({
  labOnly = false,
  tournamentOnly = false,
  locale,
} = {}) {
  return buildGameOptions({ labOnly, tournamentOnly, locale }).map(({ id, name }) => {
    const info = gameinfo.get(id);
    const designerList =
      info?.people?.filter((p) => p.type === "designer") ?? [];
    const categories = info?.categories ?? [];
    return {
      id,
      name,
      designers: designerList.map((d) => d.name).join(" "),
      designerList,
      categories,
      goalTags: categories.filter((cat) => cat.startsWith("goal")),
      boardShapeTags: categories.filter((cat) => cat.startsWith("board>shape")),
    };
  });
}

/**
 * @param {Array<{ categories?: string[] }>} games
 * @param {string} prefix
 */
export function collectCategoryFilterOptions(
  games,
  prefix,
  { locale = "en", labelFor } = {}
) {
  const tagSet = new Set();
  for (const game of games) {
    for (const cat of game.categories ?? []) {
      if (cat.startsWith(prefix)) {
        tagSet.add(cat);
      }
    }
  }
  const keys = [...tagSet];
  if (labelFor) {
    return sortCategoryKeys(keys, locale, labelFor);
  }
  return keys.sort((a, b) => tagSortFn(a, b, locale));
}

/**
 * Board shape tags plus root board tags (dynamic, none, etc.).
 * @param {Array<{ categories?: string[] }>} games
 */
export function collectBoardFilterOptions(games, { locale = "en", labelFor } = {}) {
  const tagSet = new Set();
  for (const game of games) {
    for (const cat of game.categories ?? []) {
      if (isBoardFilterCategory(cat)) {
        tagSet.add(cat);
      }
    }
  }
  const keys = [...tagSet];
  if (labelFor) {
    return sortCategoryKeys(keys, locale, labelFor);
  }
  return keys.sort((a, b) => tagSortFn(a, b, locale));
}

/**
 * @param {Array<{ id: string, name: string, designers?: string, categories?: string[] }>} games
 * @param {{
 *   query?: string,
 *   starredOnly?: boolean,
 *   starredIds?: string[],
 *   goalTag?: string,
 *   boardTag?: string,
 * }} filters
 */
export function filterGameOptions(
  games,
  {
    query = "",
    starredOnly = false,
    starredIds = [],
    goalTag = "",
    boardTag = "",
  } = {}
) {
  const q = query.trim().toLowerCase();
  const starredSet = new Set(starredIds);
  return games.filter((game) => {
    if (starredOnly && !starredSet.has(game.id)) {
      return false;
    }
    if (goalTag && !(game.categories ?? []).includes(goalTag)) {
      return false;
    }
    if (boardTag && !(game.categories ?? []).includes(boardTag)) {
      return false;
    }
    if (!q) {
      return true;
    }
    const nameMatch = game.name.toLowerCase().includes(q);
    const idMatch = game.id.toLowerCase().includes(q);
    const designerMatch = (game.designers ?? "").toLowerCase().includes(q);
    return nameMatch || idMatch || designerMatch;
  });
}
