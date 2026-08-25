import { gameinfo } from "@abstractplay/gameslib";
import { getTopRatings } from "./playerProfileSections";
import { parseRecordGameId } from "./recordGameId";
import { metaUidFromSummaryGameKey } from "./summaryGameKeys";
import { isPublicCatalogGame } from "./gameOptions";

/** Resolve a summarize ratings/summary game key to metaGame uid. */
export function metaGameFromDisplayName(gameName) {
  if (!gameName) {
    return null;
  }
  const uid = metaUidFromSummaryGameKey(gameName);
  return gameinfo.has(uid) ? uid : null;
}

/** Resolve a player record row to metaGame uid (History pattern). */
export function metaGameFromPlayerRecord(rec) {
  const gameName = rec?.header?.game?.name;
  const siteId = rec?.header?.site?.gameid;
  if (typeof siteId === "string") {
    const parsed = parseRecordGameId(siteId);
    if (parsed !== undefined) {
      return parsed.metaGame;
    }
    const hashIdx = siteId.indexOf("#");
    if (hashIdx !== -1) {
      const before = siteId.slice(0, hashIdx);
      if (before && !/^[0-9a-f-]{36}$/i.test(before)) {
        return before;
      }
    }
  }
  if (gameName) {
    const exact = [...gameinfo.entries()].find(
      ([, info]) => info.name === gameName
    );
    return exact?.[0] ?? metaGameFromDisplayName(gameName);
  }
  return null;
}

function toQuickPick(metaGame) {
  if (!metaGame || !gameinfo.has(metaGame)) {
    return null;
  }
  const info = gameinfo.get(metaGame);
  if (!isPublicCatalogGame(info)) {
    return null;
  }
  return { id: metaGame, name: info.name };
}

/**
 * @param {unknown[]} allRecs
 * @param {number} limit
 */
export function buildMostPlayedQuickPicks(allRecs, limit = 5) {
  if (!Array.isArray(allRecs) || allRecs.length === 0) {
    return [];
  }
  const countMap = new Map();
  for (const rec of allRecs) {
    const meta = metaGameFromPlayerRecord(rec);
    if (!meta) {
      continue;
    }
    countMap.set(meta, (countMap.get(meta) ?? 0) + 1);
  }
  return [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([meta]) => toQuickPick(meta))
    .filter(Boolean);
}

/**
 * @param {unknown[]} allRecs
 * @param {number} limit
 */
export function buildRecentlyPlayedQuickPicks(allRecs, limit = 5) {
  if (!Array.isArray(allRecs) || allRecs.length === 0) {
    return [];
  }
  const sorted = [...allRecs].sort((a, b) => {
    const aDate = new Date(a?.header?.["date-end"] ?? 0).getTime();
    const bDate = new Date(b?.header?.["date-end"] ?? 0).getTime();
    return bDate - aDate;
  });
  const picks = [];
  const seen = new Set();
  for (const rec of sorted) {
    const meta = metaGameFromPlayerRecord(rec);
    if (!meta || seen.has(meta)) {
      continue;
    }
    seen.add(meta);
    const pick = toQuickPick(meta);
    if (pick) {
      picks.push(pick);
    }
    if (picks.length >= limit) {
      break;
    }
  }
  return picks;
}

/**
 * @param {object|null|undefined} summary
 * @param {string|null|undefined} userId
 * @param {number} limit
 */
export function buildTopRatedQuickPicks(summary, userId, limit = 3) {
  if (!userId) {
    return [];
  }
  return getTopRatings(summary, userId, limit)
    .map(({ game }) => toQuickPick(metaGameFromDisplayName(game)))
    .filter(Boolean);
}

/**
 * @param {string[]|null|undefined} starredIds
 * @param {number} limit
 */
export function buildStarredQuickPicks(starredIds, limit = 8) {
  if (!Array.isArray(starredIds) || starredIds.length === 0) {
    return [];
  }
  return starredIds
    .slice(0, limit)
    .map((id) => toQuickPick(id))
    .filter(Boolean);
}

const DEFAULT_LIMITS = {
  starred: 8,
  mostPlayed: 5,
  topRated: 3,
  recent: 5,
};

/**
 * @param {{
 *   starredIds?: string[],
 *   allRecs?: unknown[]|null,
 *   summary?: object|null,
 *   userId?: string|null,
 *   limits?: Partial<typeof DEFAULT_LIMITS>,
 *   labOnly?: boolean,
 *   isLabSupported?: (metaGame: string) => boolean,
 * }} params
 */
export function buildPlayerQuickPickSections({
  starredIds = [],
  allRecs = null,
  summary = null,
  userId = null,
  limits = {},
  labOnly = false,
  isLabSupported = () => true,
} = {}) {
  const mergedLimits = { ...DEFAULT_LIMITS, ...limits };
  const seen = new Set();
  const sections = [];

  const addSection = (key, items) => {
    let games = items.filter(Boolean);
    if (labOnly) {
      games = games.filter((g) => isLabSupported(g.id));
    }
    const unique = [];
    for (const game of games) {
      if (seen.has(game.id)) {
        continue;
      }
      seen.add(game.id);
      unique.push(game);
    }
    if (unique.length > 0) {
      sections.push({ key, games: unique });
    }
  };

  addSection(
    "starred",
    buildStarredQuickPicks(starredIds, mergedLimits.starred)
  );
  if (Array.isArray(allRecs)) {
    addSection(
      "mostPlayed",
      buildMostPlayedQuickPicks(allRecs, mergedLimits.mostPlayed)
    );
  }
  addSection(
    "topRated",
    buildTopRatedQuickPicks(summary, userId, mergedLimits.topRated)
  );
  if (Array.isArray(allRecs)) {
    addSection(
      "recent",
      buildRecentlyPlayedQuickPicks(allRecs, mergedLimits.recent)
    );
  }

  return sections;
}
