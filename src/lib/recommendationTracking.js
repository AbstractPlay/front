import { callAuthApi, getAuthToken } from "./api";

const QUERY = "log_recommendation_event";

/**
 * @param {Record<string, unknown>} pars
 */
async function logRecommendationEvent(pars) {
  const token = await getAuthToken();
  if (!token) return;

  try {
    await callAuthApi(QUERY, pars, false);
  } catch {
    // Fire-and-forget: tracking must never block UI or prompt re-login.
  }
}

/**
 * @param {{
 *   batchId: string,
 *   surface: "gamePicker" | "explore" | "dashboard",
 *   tier: "cold" | "warm",
 *   recommendations: Array<{ id: string, reasonType?: string }>,
 * }} params
 */
export function trackRecommendationShow({
  batchId,
  surface,
  tier,
  recommendations,
}) {
  if (!batchId || !recommendations?.length) return;

  void logRecommendationEvent({
    event: "rec_show",
    batchId,
    surface,
    tier,
    gameIds: recommendations.map((rec) => rec.id),
    reasons: recommendations.map((rec) => rec.reasonType ?? "content"),
  });
}

/**
 * @param {{
 *   batchId: string,
 *   surface: "gamePicker" | "explore" | "dashboard",
 *   tier: "cold" | "warm",
 *   metaGame: string,
 *   position: number,
 *   reasonType: "content" | "cooccur" | "popularity" | "new",
 * }} params
 */
export function trackRecommendationClick({
  batchId,
  surface,
  tier,
  metaGame,
  position,
  reasonType,
}) {
  if (!batchId || !metaGame) return;

  void logRecommendationEvent({
    event: "rec_click",
    batchId,
    surface,
    tier,
    metaGame,
    position,
    reasonType,
  });
}

/**
 * @param {{
 *   batchId: string,
 *   surface: "gamePicker" | "explore" | "dashboard",
 *   tier: "cold" | "warm",
 *   metaGame: string,
 * }} params
 */
export function trackRecommendationChallenge({
  batchId,
  surface,
  tier,
  metaGame,
}) {
  if (!batchId || !metaGame) return;

  void logRecommendationEvent({
    event: "rec_challenge",
    batchId,
    surface,
    tier,
    metaGame,
  });
}
