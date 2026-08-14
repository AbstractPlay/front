import { isBoardRootCategory } from "./gameOptions";

/** @typedef {Map<string, number>} FeatureVector */

export const TAG_WEIGHTS = {
  goal: 1.0,
  components: 0.4,
  boardRoot: 0.3,
  standardBoard: 0.25,
};

/** Default weight for mechanic tags not listed below. */
export const MECHANIC_WEIGHT_DEFAULT = 0.7;

/** Weight for distinctive mechanic families (see ELEVATED_MECHANIC_PREFIXES). */
export const MECHANIC_WEIGHT_ELEVATED = 0.85;

/** Mechanic tags omitted from taste matching (too common to discriminate). */
export const IGNORED_MECHANIC_PREFIXES = [
  "mechanic>capture",
  "mechanic>move",
  "mechanic>place",
];

/**
 * Mechanic families weighted above MECHANIC_WEIGHT_DEFAULT.
 * Prefix match: `mechanic>random` includes `mechanic>random>play`, etc.
 */
export const ELEVATED_MECHANIC_PREFIXES = [
  "mechanic>asymmetry",
  "mechanic>differentiate",
  "mechanic>economy",
  "mechanic>hidden",
  "mechanic>network",
  "mechanic>program",
  "mechanic>random",
  "mechanic>simultaneous",
];

export const STANDARD_BOARD_FEATURE = "board>hasStandardBoard";

/**
 * @param {string} tag
 * @returns {number | null} Feature weight, or null if the tag is ignored.
 */
export function mechanicTagWeight(tag) {
  if (!tag.startsWith("mechanic")) {
    return null;
  }
  for (const prefix of IGNORED_MECHANIC_PREFIXES) {
    if (tag === prefix || tag.startsWith(`${prefix}>`)) {
      return null;
    }
  }
  for (const prefix of ELEVATED_MECHANIC_PREFIXES) {
    if (tag === prefix || tag.startsWith(`${prefix}>`)) {
      return MECHANIC_WEIGHT_ELEVATED;
    }
  }
  return MECHANIC_WEIGHT_DEFAULT;
}

/**
 * All hierarchical prefixes for a tag, e.g. goal>score>race →
 * [goal, goal>score, goal>score>race].
 * @param {string} tag
 */
export function expandTagPrefixes(tag) {
  if (!tag || !tag.includes(">")) {
    return tag ? [tag] : [];
  }
  const parts = tag.split(">");
  const prefixes = [];
  for (let i = 1; i <= parts.length; i++) {
    prefixes.push(parts.slice(0, i).join(">"));
  }
  return prefixes;
}

/**
 * @param {FeatureVector} features
 * @param {string} tag
 * @param {number} weight
 */
function addWeightedFeatures(features, tag, weight) {
  for (const prefix of expandTagPrefixes(tag)) {
    const prev = features.get(prefix) ?? 0;
    features.set(prefix, Math.max(prev, weight));
  }
}

/**
 * Normalize game categories into a weighted feature vector for recommendations.
 * @param {string[] | null | undefined} categories
 * @returns {FeatureVector}
 */
export function gameRecommendationFeatures(categories) {
  /** @type {FeatureVector} */
  const features = new Map();
  const cats = categories ?? [];
  let hasStandardBoard = false;

  for (const cat of cats) {
    if (cat.startsWith("board>shape")) {
      hasStandardBoard = true;
      continue;
    }
    if (cat.startsWith("board>connect")) {
      continue;
    }
    if (cat.startsWith("goal")) {
      addWeightedFeatures(features, cat, TAG_WEIGHTS.goal);
    } else if (cat.startsWith("mechanic")) {
      const weight = mechanicTagWeight(cat);
      if (weight != null) {
        addWeightedFeatures(features, cat, weight);
      }
    } else if (cat.startsWith("components")) {
      addWeightedFeatures(features, cat, TAG_WEIGHTS.components);
    } else if (isBoardRootCategory(cat)) {
      addWeightedFeatures(features, cat, TAG_WEIGHTS.boardRoot);
    }
  }

  if (hasStandardBoard) {
    const prev = features.get(STANDARD_BOARD_FEATURE) ?? 0;
    features.set(
      STANDARD_BOARD_FEATURE,
      Math.max(prev, TAG_WEIGHTS.standardBoard)
    );
  }

  return features;
}

/**
 * Top-level goal bucket for diversity cap, e.g. goal>score>race → goal>score.
 * @param {string} tag
 * @returns {string | null}
 */
export function topLevelGoalBucket(tag) {
  if (!tag.startsWith("goal>")) {
    return null;
  }
  const rest = tag.slice("goal>".length);
  const firstSegment = rest.split(">")[0];
  return firstSegment ? `goal>${firstSegment}` : null;
}

/**
 * All distinct top-level goal buckets on a game.
 * @param {string[] | null | undefined} categories
 * @returns {string[]}
 */
export function topLevelGoalTags(categories) {
  const buckets = new Set();
  for (const cat of categories ?? []) {
    if (!cat.startsWith("goal")) {
      continue;
    }
    for (const prefix of expandTagPrefixes(cat)) {
      const bucket = topLevelGoalBucket(prefix);
      if (bucket) {
        buckets.add(bucket);
      }
    }
  }
  return [...buckets].sort();
}

/**
 * Primary top-level goal bucket when a game spans multiple goals — the bucket
 * with the highest accumulated goal feature weight.
 * @param {string[] | null | undefined} categories
 * @returns {string | null}
 */
export function topLevelGoalTag(categories) {
  const buckets = topLevelGoalTags(categories);
  if (buckets.length === 0) {
    return null;
  }
  if (buckets.length === 1) {
    return buckets[0];
  }

  const features = gameRecommendationFeatures(categories);
  let best = buckets[0];
  let bestScore = -1;

  for (const bucket of buckets) {
    let bucketScore = 0;
    for (const [key, weight] of features) {
      if (key === bucket || key.startsWith(`${bucket}>`)) {
        bucketScore += weight;
      }
    }
    if (bucketScore > bestScore) {
      bestScore = bucketScore;
      best = bucket;
    }
  }

  return best;
}
