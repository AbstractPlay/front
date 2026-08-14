import { gameinfo } from "@abstractplay/gameslib";
import { gameRecommendationFeatures } from "./recommendationTagFeatures";
import {
  buildRecentlyPlayedQuickPicks,
  metaGameFromDisplayName,
  metaGameFromPlayerRecord,
} from "./playerGameQuickPicks";
import { getTopRatings } from "./playerProfileSections";

export const PROFILE_WEIGHTS = {
  star: 3.0,
  topRated: 2.0,
  playShare: 1.0,
  recent: 0.5,
};

const RECENT_UNIQUE_LIMIT = 5;
const SEED_LIMIT = 10;

/**
 * @param {Map<string, number>} vector
 * @returns {Map<string, number>}
 */
export function l2NormalizeFeatureVector(vector) {
  let sumSq = 0;
  for (const value of vector.values()) {
    sumSq += value * value;
  }
  if (sumSq === 0) {
    return new Map(vector);
  }
  const norm = Math.sqrt(sumSq);
  const normalized = new Map();
  for (const [key, value] of vector) {
    normalized.set(key, value / norm);
  }
  return normalized;
}

/**
 * @param {{
 *   starredIds?: string[],
 *   allRecs?: unknown[] | null,
 *   summary?: object | null,
 *   userId?: string | null,
 * }} params
 */
export function buildPlayerRecommendationProfile({
  starredIds = [],
  allRecs = null,
  summary = null,
  userId = null,
} = {}) {
  const starredSet = new Set(starredIds.filter(Boolean));
  /** @type {Map<string, number>} */
  const playCounts = new Map();
  const playedMetaGames = new Set();

  if (Array.isArray(allRecs)) {
    for (const rec of allRecs) {
      const meta = metaGameFromPlayerRecord(rec);
      if (!meta) {
        continue;
      }
      playedMetaGames.add(meta);
      playCounts.set(meta, (playCounts.get(meta) ?? 0) + 1);
    }
  }

  const totalPlays = [...playCounts.values()].reduce((sum, count) => sum + count, 0);
  /** @type {Map<string, number>} */
  const playShare = new Map();
  for (const [meta, count] of playCounts) {
    playShare.set(meta, totalPlays > 0 ? count / totalPlays : 0);
  }

  const topRatedMetas = new Set();
  if (userId) {
    for (const { game } of getTopRatings(summary, userId, 10)) {
      const meta = metaGameFromDisplayName(game);
      if (meta) {
        topRatedMetas.add(meta);
      }
    }
  }

  const recentlyPlayed = buildRecentlyPlayedQuickPicks(allRecs ?? [], RECENT_UNIQUE_LIMIT);
  const recentSet = new Set(recentlyPlayed.map((game) => game.id));

  /** @type {Map<string, number>} */
  const profileWeightByMeta = new Map();
  const contributingMetas = new Set([
    ...starredSet,
    ...playedMetaGames,
    ...topRatedMetas,
    ...recentSet,
  ]);

  for (const meta of contributingMetas) {
    let weight = 0;
    if (starredSet.has(meta)) {
      weight += PROFILE_WEIGHTS.star;
    }
    if (topRatedMetas.has(meta)) {
      weight += PROFILE_WEIGHTS.topRated;
    }
    weight += PROFILE_WEIGHTS.playShare * (playShare.get(meta) ?? 0);
    if (recentSet.has(meta)) {
      weight += PROFILE_WEIGHTS.recent;
    }
    if (weight > 0) {
      profileWeightByMeta.set(meta, weight);
    }
  }

  const seedMetaGames = [...profileWeightByMeta.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, SEED_LIMIT)
    .map(([meta]) => meta);

  /** @type {Map<string, number>} */
  const tasteVectorRaw = new Map();
  for (const [meta, weight] of profileWeightByMeta) {
    const info = gameinfo.get(meta);
    if (!info) {
      continue;
    }
    const features = gameRecommendationFeatures(info.categories ?? []);
    for (const [feature, featureWeight] of features) {
      tasteVectorRaw.set(
        feature,
        (tasteVectorRaw.get(feature) ?? 0) + weight * featureWeight
      );
    }
  }

  const distinctPlayed = playedMetaGames.size;
  const tier =
    userId && (distinctPlayed >= 2 || starredSet.size >= 1) ? "warm" : "cold";

  return {
    tier,
    userId,
    playedMetaGames,
    playCounts,
    playShare,
    seedMetaGames,
    profileWeightByMeta,
    tasteVector: l2NormalizeFeatureVector(tasteVectorRaw),
    starredSet,
  };
}
