import { trackRecommendationChallenge } from "./recommendationTracking";

export const RECOMMENDATION_ATTRIBUTION_KEY = "ap-rec-attribution";

/**
 * @typedef {{
 *   batchId: string,
 *   surface: "gamePicker" | "explore" | "dashboard",
 *   tier: "cold" | "warm",
 *   metaGame: string,
 * }} RecommendationAttribution
 */

function getSessionStorage() {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * @returns {RecommendationAttribution | null}
 */
export function readRecommendationAttribution() {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(RECOMMENDATION_ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed?.batchId ||
      !parsed?.surface ||
      !parsed?.tier ||
      !parsed?.metaGame
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {RecommendationAttribution} attribution
 */
export function saveRecommendationAttribution(attribution) {
  const storage = getSessionStorage();
  if (!storage || !attribution?.batchId || !attribution?.metaGame) return;
  try {
    storage.setItem(RECOMMENDATION_ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Private mode / quota — ignore.
  }
}

export function clearRecommendationAttribution() {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(RECOMMENDATION_ATTRIBUTION_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * If session attribution matches `metaGame`, fire `rec_challenge` and clear storage.
 * Clears stale attribution when a different game is challenged.
 * @param {string | null | undefined} metaGame
 */
export function maybeTrackRecommendationChallenge(metaGame) {
  if (!metaGame) return;

  const attribution = readRecommendationAttribution();
  if (!attribution) return;

  if (attribution.metaGame !== metaGame) {
    clearRecommendationAttribution();
    return;
  }

  trackRecommendationChallenge({
    batchId: attribution.batchId,
    surface: attribution.surface,
    tier: attribution.tier,
    metaGame: attribution.metaGame,
  });
  clearRecommendationAttribution();
}
