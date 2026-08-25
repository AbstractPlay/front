import { gameinfo } from "@abstractplay/gameslib";
import { isPublicCatalogGame } from "./gameOptions";
import {
  gameRecommendationFeatures,
  topLevelGoalTag,
} from "./recommendationTagFeatures";

export const HYBRID_WEIGHTS = {
  content: 0.45,
  cooccur: 0.35,
  popularity: 0.15,
  recency: 0.1,
};

export const NEW_GAME_WINDOW_DAYS = 90;
export const GOAL_DIVERSITY_CAP = 2;
export const GOAL_DIVERSITY_CAP_FALLBACK = 3;

const MS_PER_DAY = 86_400_000;

/**
 * @param {string | null | undefined} dateAdded
 * @param {Date} [referenceDate]
 */
export function computeRecencyScore(dateAdded, referenceDate = new Date()) {
  if (!dateAdded) {
    return 0;
  }
  const addedMs = new Date(dateAdded).getTime();
  if (Number.isNaN(addedMs)) {
    return 0;
  }
  const ageDays = (referenceDate.getTime() - addedMs) / MS_PER_DAY;
  if (ageDays < 0) {
    return 1;
  }
  if (ageDays >= NEW_GAME_WINDOW_DAYS) {
    return 0;
  }
  return 1 - ageDays / NEW_GAME_WINDOW_DAYS;
}

/**
 * @param {Map<string, number>} a
 * @param {Map<string, number>} b
 */
export function featureDot(a, b) {
  let sum = 0;
  for (const [key, aVal] of a) {
    const bVal = b.get(key);
    if (bVal !== undefined) {
      sum += aVal * bVal;
    }
  }
  return sum;
}

/**
 * @param {Map<string, number>} values
 */
export function normalizeScoreMap(values) {
  let max = 0;
  for (const value of values.values()) {
    max = Math.max(max, value);
  }
  const normalized = new Map();
  for (const [key, value] of values) {
    normalized.set(key, max > 0 ? value / max : 0);
  }
  return normalized;
}

/**
 * @param {import("./recommendationTagFeatures").FeatureVector} tasteVector
 * @param {string[]} categories
 */
export function computeContentScore(tasteVector, categories) {
  if (!tasteVector || tasteVector.size === 0) {
    return 0;
  }
  return featureDot(tasteVector, gameRecommendationFeatures(categories));
}

/**
 * @param {object | null | undefined} popularityData
 * @returns {Map<string, number>}
 */
export function buildPopularityNormMap(popularityData) {
  const rows = popularityData?.moves1w ?? [];
  /** @type {Map<string, number>} */
  const raw = new Map();
  let max = 0;
  for (const row of rows) {
    const score = row?.score ?? 0;
    if (row?.metaGame) {
      raw.set(row.metaGame, score);
      max = Math.max(max, score);
    }
  }
  /** @type {Map<string, number>} */
  const norm = new Map();
  for (const [meta, score] of raw) {
    norm.set(meta, max > 0 ? score / max : 0);
  }
  return norm;
}

/**
 * @param {string} candidate
 * @param {string[]} seedMetaGames
 * @param {object | null | undefined} cooccurData
 */
export function lookupCooccurScore(candidate, seedMetaGames, cooccurData) {
  if (!cooccurData?.games || seedMetaGames.length === 0) {
    return { score: 0, bestSeed: null };
  }
  let score = 0;
  let bestSeed = null;
  let bestPmi = -Infinity;
  for (const seed of seedMetaGames) {
    const neighbors = cooccurData.games[seed] ?? [];
    const hit = neighbors.find((entry) => entry.metaGame === candidate);
    if (!hit) {
      continue;
    }
    score += hit.pmi ?? 0;
    if ((hit.pmi ?? 0) > bestPmi) {
      bestPmi = hit.pmi ?? 0;
      bestSeed = seed;
    }
  }
  return { score, bestSeed };
}

/**
 * @param {string} candidateId
 * @param {string[]} categories
 * @param {string[]} seedMetaGames
 */
export function findTopSeedOverlaps(candidateId, categories, seedMetaGames) {
  const candidateFeatures = gameRecommendationFeatures(categories);
  const overlaps = [];
  for (const seed of seedMetaGames) {
    if (seed === candidateId) {
      continue;
    }
    const info = gameinfo.get(seed);
    if (!info) {
      continue;
    }
    const overlap = featureDot(
      candidateFeatures,
      gameRecommendationFeatures(info.categories ?? [])
    );
    if (overlap > 0) {
      overlaps.push({ meta: seed, name: info.name, overlap });
    }
  }
  overlaps.sort((a, b) => b.overlap - a.overlap);
  return overlaps;
}

/**
 * @param {{
 *   content: number,
 *   cooccur: number,
 *   popularity: number,
 *   recency: number,
 *   seedMetaGames: string[],
 *   candidateId: string,
 *   categories: string[],
 *   cooccurBestSeed: string | null,
 * }} params
 */
export function buildRecommendationReason({
  content,
  cooccur,
  popularity,
  recency,
  seedMetaGames,
  candidateId,
  categories,
  cooccurBestSeed,
}) {
  const weighted = {
    content: HYBRID_WEIGHTS.content * content,
    cooccur: HYBRID_WEIGHTS.cooccur * cooccur,
    popularity: HYBRID_WEIGHTS.popularity * popularity,
    new: HYBRID_WEIGHTS.recency * recency,
  };
  const reasonType = Object.entries(weighted).sort((a, b) => b[1] - a[1])[0][0];

  if (reasonType === "new") {
    return { reasonType: "new", reason: "New on Abstract Play" };
  }
  if (reasonType === "cooccur" && cooccurBestSeed) {
    const seedName = gameinfo.get(cooccurBestSeed)?.name ?? cooccurBestSeed;
    return {
      reasonType: "cooccur",
      reason: `Popular with players who play ${seedName}`,
    };
  }
  if (reasonType === "popularity") {
    return { reasonType: "popularity", reason: "Trending this week" };
  }

  const overlaps = findTopSeedOverlaps(candidateId, categories, seedMetaGames);
  if (overlaps.length > 0) {
    const names = overlaps.slice(0, 2).map((entry) => entry.name);
    const reason =
      names.length === 1
        ? `Similar to ${names[0]}`
        : `Similar to ${names[0]} and ${names[1]}`;
    return { reasonType: "content", reason };
  }

  return { reasonType: "content", reason: "Recommended for you" };
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   categories: string[],
 *   dateAdded?: string,
 * }} CandidateGame
 */

/**
 * @param {Array<{ id: string, score: number, goalBucket: string | null } & object>} ranked
 * @param {number} limit
 * @param {number} cap
 */
export function selectWithGoalDiversityCap(ranked, limit, cap) {
  const goalCounts = new Map();
  const selected = [];
  for (const item of ranked) {
    const bucket = item.goalBucket ?? "__none__";
    if ((goalCounts.get(bucket) ?? 0) >= cap) {
      continue;
    }
    goalCounts.set(bucket, (goalCounts.get(bucket) ?? 0) + 1);
    selected.push(item);
    if (selected.length >= limit) {
      break;
    }
  }
  return selected;
}

/**
 * @param {CandidateGame[]} candidates
 * @param {Set<string>} playedMetaGames
 * @param {string[]} excludeIds
 */
export function filterRecommendationCandidates(
  candidates,
  playedMetaGames,
  excludeIds = []
) {
  const exclude = new Set(excludeIds);
  return candidates.filter(
    (game) => !playedMetaGames.has(game.id) && !exclude.has(game.id)
  );
}

/**
 * @param {{
 *   profile: ReturnType<typeof import("./playerRecommendationProfile").buildPlayerRecommendationProfile>,
 *   cooccurData?: object | null,
 *   popularityData?: object | null,
 *   limit?: number,
 *   excludeIds?: string[],
 *   referenceDate?: Date,
 *   catalog?: CandidateGame[] | null,
 * }} params
 */
export function buildGameRecommendations({
  profile,
  cooccurData = null,
  popularityData = null,
  limit = 8,
  excludeIds = [],
  referenceDate = new Date(),
  catalog = null,
} = {}) {
  const candidates =
    catalog ??
    [...gameinfo.entries()]
      .filter(([, info]) => isPublicCatalogGame(info))
      .map(([id, info]) => ({
        id,
        name: info.name,
        categories: info.categories ?? [],
        dateAdded: info.dateAdded,
      }));

  const popularityNorm = buildPopularityNormMap(popularityData);
  const playedMetaGames =
    profile?.playedMetaGames ?? new Set();

  if (profile?.tier === "cold") {
    return buildColdTierRecommendations({
      candidates,
      playedMetaGames,
      excludeIds,
      popularityNorm,
      limit,
      referenceDate,
    });
  }

  const eligible = filterRecommendationCandidates(
    candidates,
    playedMetaGames,
    excludeIds
  );

  /** @type {Map<string, number>} */
  const contentRaw = new Map();
  /** @type {Map<string, number>} */
  const cooccurRaw = new Map();
  /** @type {Map<string, { bestSeed: string | null }>} */
  const cooccurMeta = new Map();

  for (const game of eligible) {
    contentRaw.set(
      game.id,
      computeContentScore(profile.tasteVector, game.categories)
    );
    const cooccur = lookupCooccurScore(
      game.id,
      profile.seedMetaGames,
      cooccurData
    );
    cooccurRaw.set(game.id, cooccur.score);
    cooccurMeta.set(game.id, { bestSeed: cooccur.bestSeed });
  }

  const contentNorm = normalizeScoreMap(contentRaw);
  const cooccurNorm = normalizeScoreMap(cooccurRaw);

  const ranked = eligible
    .map((game) => {
      const content = contentNorm.get(game.id) ?? 0;
      const cooccur = cooccurNorm.get(game.id) ?? 0;
      const popularity = popularityNorm.get(game.id) ?? 0;
      const recency = computeRecencyScore(game.dateAdded, referenceDate);
      const score =
        HYBRID_WEIGHTS.content * content +
        HYBRID_WEIGHTS.cooccur * cooccur +
        HYBRID_WEIGHTS.popularity * popularity +
        HYBRID_WEIGHTS.recency * recency;
      const { reason, reasonType } = buildRecommendationReason({
        content,
        cooccur,
        popularity,
        recency,
        seedMetaGames: profile.seedMetaGames,
        candidateId: game.id,
        categories: game.categories,
        cooccurBestSeed: cooccurMeta.get(game.id)?.bestSeed ?? null,
      });
      return {
        id: game.id,
        name: game.name,
        score,
        reason,
        reasonType,
        goalBucket: topLevelGoalTag(game.categories),
      };
    })
    .sort((a, b) => b.score - a.score);

  let selected = selectWithGoalDiversityCap(ranked, limit, GOAL_DIVERSITY_CAP);
  if (selected.length < limit) {
    selected = selectWithGoalDiversityCap(
      ranked,
      limit,
      GOAL_DIVERSITY_CAP_FALLBACK
    );
  }

  return selected.map(({ goalBucket, ...rec }) => rec);
}

/**
 * @param {{
 *   candidates: CandidateGame[],
 *   playedMetaGames: Set<string>,
 *   excludeIds: string[],
 *   popularityNorm: Map<string, number>,
 *   limit: number,
 *   referenceDate: Date,
 * }} params
 */
function buildColdTierRecommendations({
  candidates,
  playedMetaGames,
  excludeIds,
  popularityNorm,
  limit,
  referenceDate,
}) {
  const eligible = filterRecommendationCandidates(
    candidates,
    playedMetaGames,
    excludeIds
  );

  const byPopularity = [...eligible].sort(
    (a, b) => (popularityNorm.get(b.id) ?? 0) - (popularityNorm.get(a.id) ?? 0)
  );

  const rankedPopular = byPopularity.map((game) => ({
    id: game.id,
    name: game.name,
    score: popularityNorm.get(game.id) ?? 0,
    reason:
      (popularityNorm.get(game.id) ?? 0) > 0
        ? "Trending this week"
        : "Popular on Abstract Play",
    reasonType: "popularity",
    goalBucket: topLevelGoalTag(game.categories),
  }));

  let selected = selectWithGoalDiversityCap(
    rankedPopular,
    limit,
    GOAL_DIVERSITY_CAP
  );
  if (selected.length < limit) {
    selected = selectWithGoalDiversityCap(
      rankedPopular,
      limit,
      GOAL_DIVERSITY_CAP_FALLBACK
    );
  }

  if (selected.length >= limit) {
    return selected.map(({ goalBucket, ...rec }) => rec);
  }

  const selectedIds = new Set(selected.map((game) => game.id));
  const byNewest = [...eligible]
    .filter((game) => !selectedIds.has(game.id))
    .sort((a, b) => {
      const aTime = new Date(a.dateAdded ?? 0).getTime();
      const bTime = new Date(b.dateAdded ?? 0).getTime();
      return bTime - aTime;
    })
    .map((game) => ({
      id: game.id,
      name: game.name,
      score: computeRecencyScore(game.dateAdded, referenceDate),
      reason: "Recently added",
      reasonType: "new",
      goalBucket: topLevelGoalTag(game.categories),
    }));

  const combined = [...selected, ...byNewest];
  let filled = selectWithGoalDiversityCap(combined, limit, GOAL_DIVERSITY_CAP);
  if (filled.length < limit) {
    filled = selectWithGoalDiversityCap(
      combined,
      limit,
      GOAL_DIVERSITY_CAP_FALLBACK
    );
  }
  return filled.map(({ goalBucket, ...rec }) => rec);
}
