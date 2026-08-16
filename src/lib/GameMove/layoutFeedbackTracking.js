import { callAuthApi, getAuthToken } from "../api";
import { LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH } from "./layoutFeedbackConstants";

const QUERY = "log_layout_feedback_event";

/**
 * @param {Record<string, unknown>} pars
 */
async function logLayoutFeedbackEventRemote(pars) {
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
 *   layoutId: string,
 *   gameId?: string,
 * }} params
 */
export function trackLayoutSessionStart({ layoutId, gameId }) {
  if (!layoutId) return;

  void logLayoutFeedbackEventRemote({
    event: "session_start",
    layoutId,
    gameId,
  });
}

/**
 * @param {{
 *   layoutId: string,
 *   rating: "up" | "down",
 *   gameId?: string,
 *   durationMs?: number,
 * }} params
 */
export function trackLayoutFeedback({ layoutId, rating, gameId, durationMs }) {
  if (!layoutId || !rating) return;

  void logLayoutFeedbackEventRemote({
    event: "feedback",
    layoutId,
    rating,
    gameId,
    durationMs,
  });
}

/**
 * @param {{
 *   layoutId: string,
 *   comment: string,
 *   gameId?: string,
 *   durationMs?: number,
 * }} params
 */
export function trackLayoutFeedbackNote({ layoutId, comment, gameId, durationMs }) {
  if (!layoutId) return;

  const trimmed = comment?.trim() ?? "";
  if (!trimmed || trimmed.length > LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH) {
    return;
  }

  void logLayoutFeedbackEventRemote({
    event: "feedback_note",
    layoutId,
    comment: trimmed,
    gameId,
    durationMs,
  });
}

/**
 * @param {{
 *   layoutId: string,
 *   gameId?: string,
 *   durationMs?: number,
 * }} params
 */
export function trackLayoutSwitchToClassic({ layoutId, gameId, durationMs }) {
  if (!layoutId) return;

  void logLayoutFeedbackEventRemote({
    event: "switch_to_classic",
    layoutId,
    gameId,
    durationMs,
  });
}

/**
 * @param {{
 *   layoutId: string,
 *   toLayoutId: string,
 *   gameId?: string,
 * }} params
 */
export function trackLayoutSwitch({ layoutId, toLayoutId, gameId }) {
  if (!layoutId || !toLayoutId || layoutId === toLayoutId) return;

  void logLayoutFeedbackEventRemote({
    event: "layout_switch",
    layoutId,
    toLayoutId,
    gameId,
  });
}
