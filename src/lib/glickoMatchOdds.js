import { canonicalVariantUids } from "./expandVariants";
import { resolveMetaUid } from "./summaryGameKeys";

export const GLICKO_RATING_START = 1200;
export const GLICKO_RD_START = 350;
export const GLICKO_VOLATILITY_START = 0.06;

/** Glicko-2 μ/φ scale factor. */
const GLICKO2_SCALE = 173.7178;

/**
 * @param {number} rating
 * @param {number} rd
 * @param {number} volatility
 * @param {number} n
 */
function toGlickoStats(rating, rd, volatility, n) {
  const ratingLow = rating - 2 * rd;
  const ratingHigh = rating + 2 * rd;
  return {
    rating,
    rd,
    volatility,
    ratingLow,
    ratingHigh,
    provisional: n < 10 || rd > 200,
    established: n >= 20 && rd <= 110,
    n,
  };
}

export function defaultGlickoPrior() {
  return toGlickoStats(
    GLICKO_RATING_START,
    GLICKO_RD_START,
    GLICKO_VOLATILITY_START,
    0
  );
}

/** Meta UID + variant UIDs → summarize `highest[].game` key (matches backend-crons). */
export function batchRatingGameLabel(metaUid, variants) {
  if (variants.length === 0) {
    return `${metaUid} (no variants)`;
  }
  const sorted = [...variants].sort((a, b) => a.localeCompare(b));
  return `${metaUid} (${sorted.join("|")})`;
}

/**
 * @param {string} metaUid
 * @param {readonly string[]} rawVariantUids
 * @param {number} numPlayers
 */
export function canonicalVariantUidsForPool(metaUid, rawVariantUids, numPlayers) {
  return canonicalVariantUids(metaUid, rawVariantUids, numPlayers);
}

/**
 * @param {string} metaUid
 * @param {readonly string[]} rawVariantUids
 * @param {number} [numPlayers=2]
 */
export function batchRatingGameKeyForMeta(metaUid, rawVariantUids, numPlayers = 2) {
  const resolvedUid = resolveMetaUid(metaUid);
  const canonical = canonicalVariantUidsForPool(
    resolvedUid,
    rawVariantUids,
    numPlayers
  );
  return batchRatingGameLabel(resolvedUid, canonical);
}

/**
 * @param {{ user: string, game: string, glicko?: { rating?: number, rd?: number } }[]} highest
 */
export function buildHighestGlickoMap(highest) {
  const map = new Map();
  for (const row of highest ?? []) {
    if (row?.user && row?.game && row.glicko?.rd != null && row.glicko?.rating != null) {
      map.set(`${row.user}|${row.game}`, row.glicko);
    }
  }
  return map;
}

/**
 * @param {Map<string, { rating: number, rd: number }>} highestMap
 * @param {string} userId
 * @param {string} gameKey
 */
export function lookupGlickoForPool(highestMap, userId, gameKey) {
  const found = highestMap.get(`${userId}|${gameKey}`);
  if (found?.rd != null && found?.rating != null) {
    return found;
  }
  return defaultGlickoPrior();
}

/**
 * @param {{ rating: number, rd: number }} player
 * @param {{ rating: number, rd: number }} opponent
 * @returns {number} Expected score for player (0–1), treated as win probability.
 */
export function glicko2ExpectedScore(player, opponent) {
  const mu = (player.rating - 1500) / GLICKO2_SCALE;
  const muOpp = (opponent.rating - 1500) / GLICKO2_SCALE;
  const phiOpp = opponent.rd / GLICKO2_SCALE;
  const g = 1 / Math.sqrt(1 + 3 * phiOpp * phiOpp);
  return 1 / (1 + Math.exp(-g * (mu - muOpp)));
}

/**
 * @param {number|null|undefined} rate
 */
export function formatMatchWinRatePercent(rate) {
  if (rate == null || Number.isNaN(rate)) {
    return "—";
  }
  return `${Math.round(rate * 1000) / 10}%`;
}

/** @typedef {"all" | "good" | "ideal"} MatchFilterMode */

/**
 * @param {number} p Expected win rate for logged-in user (0–1).
 * @param {MatchFilterMode} mode
 */
export function passesMatchCompetitivenessFilter(p, mode) {
  if (mode === "all") {
    return true;
  }
  if (mode === "ideal") {
    return p >= 0.45 && p <= 0.55;
  }
  if (mode === "good") {
    return p >= 0.35 && p <= 0.65;
  }
  return true;
}

/**
 * @param {object} opts
 * @param {Map<string, { rating: number, rd: number }>} opts.highestMap
 * @param {string} opts.userId
 * @param {string} opts.challengerId
 * @param {string} opts.metaUid
 * @param {readonly string[]} opts.variantUids
 * @param {number} opts.numPlayers
 * @param {boolean} opts.rated
 */
export function matchWinRateForChallenge({
  highestMap,
  userId,
  challengerId,
  metaUid,
  variantUids,
  numPlayers,
  rated,
}) {
  if (!rated) {
    return null;
  }
  const gameKey = batchRatingGameKeyForMeta(metaUid, variantUids, numPlayers);
  const meGlicko = lookupGlickoForPool(highestMap, userId, gameKey);
  const challengerGlicko = lookupGlickoForPool(
    highestMap,
    challengerId,
    gameKey
  );
  return glicko2ExpectedScore(meGlicko, challengerGlicko);
}
