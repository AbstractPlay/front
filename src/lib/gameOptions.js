import { gameinfo } from "@abstractplay/gameslib";
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
  return (gameinfo.get(metaUid)?.name ?? fallback ?? metaUid) || "Unknown";
}

/** Meta-game uids listed in public catalog UIs. */
export function listPublicCatalogMetas() {
  return [...gameinfo.keys()].filter((id) =>
    isPublicCatalogGame(gameinfo.get(id))
  );
}

export function tagSortFn(a, b) {
  const priority = (raw) => {
    if (raw.startsWith("goal")) return 1;
    if (raw.startsWith("mech")) return 2;
    if (raw.startsWith("board>shape")) return 3.1;
    if (raw.startsWith("board>connect")) return 3.2;
    if (/^board>[^>]+$/.test(raw)) return 3.05;
    if (raw.startsWith("board")) return 3;
    return 4;
  };
  const va = priority(a);
  const vb = priority(b);
  return va === vb ? a.localeCompare(b) : va - vb;
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
 * @param {{ labOnly?: boolean, tournamentOnly?: boolean }} options
 * @returns {{ id: string, name: string }[]}
 */
export function buildGameOptions({ labOnly = false, tournamentOnly = false } = {}) {
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
    options.push({ id: info.uid, name: info.name });
  }
  options.sort((a, b) => a.name.localeCompare(b.name));
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
 * @param {{ labOnly?: boolean, tournamentOnly?: boolean }} options
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
export function buildGameBrowseEntries({ labOnly = false, tournamentOnly = false } = {}) {
  return buildGameOptions({ labOnly, tournamentOnly }).map(({ id, name }) => {
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
export function collectCategoryFilterOptions(games, prefix) {
  const tagSet = new Set();
  for (const game of games) {
    for (const cat of game.categories ?? []) {
      if (cat.startsWith(prefix)) {
        tagSet.add(cat);
      }
    }
  }
  return [...tagSet].sort(tagSortFn);
}

/**
 * Board shape tags plus root board tags (dynamic, none, etc.).
 * @param {Array<{ categories?: string[] }>} games
 */
export function collectBoardFilterOptions(games) {
  const tagSet = new Set();
  for (const game of games) {
    for (const cat of game.categories ?? []) {
      if (isBoardFilterCategory(cat)) {
        tagSet.add(cat);
      }
    }
  }
  return [...tagSet].sort(tagSortFn);
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
