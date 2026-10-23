const CHALLENGE_BODY_TYPES = new Set([
  "challengeIssued",
  "challengeDeclined",
  "challengeRevoked",
  "challengeSlotOpened",
  "challengeParticipantLeft",
]);

const BOT_BODY_TYPES = new Set(["botMoveFailed", "botOwnerPing"]);

const DIRECT_BODY_TYPE_TO_CATEGORY = new Set([
  "gameStart",
  "gameEnd",
  "ratingChange",
  "eventInvitation",
  "completedGameChat",
  "tournamentChat",
  "tournamentStart",
  "tournamentEnd",
  "feedbackReply",
  "feedbackStatus",
  "feedbackDeleted",
  "feedbackReviewRequested",
  "feedbackNew",
]);

/** Stable filter order (announcements first, then in-app prefs, feedbackNew, bots). */
export const NOTIFICATION_FILTER_CATEGORY_ORDER = [
  "announcements",
  "challenges",
  "gameStart",
  "gameEnd",
  "ratingChange",
  "eventInvitation",
  "completedGameChat",
  "tournamentChat",
  "tournamentStart",
  "tournamentEnd",
  "feedbackReply",
  "feedbackStatus",
  "feedbackDeleted",
  "feedbackReviewRequested",
  "feedbackNew",
  "bots",
];

export function notificationCategoryForBody(body) {
  const type = body?.type;
  if (!type || typeof type !== "string") {
    return null;
  }
  if (CHALLENGE_BODY_TYPES.has(type)) {
    return "challenges";
  }
  if (BOT_BODY_TYPES.has(type)) {
    return "bots";
  }
  if (DIRECT_BODY_TYPE_TO_CATEGORY.has(type)) {
    return type;
  }
  return null;
}

export function notificationCategoryForPanelRow(row) {
  if (!row || typeof row !== "object") {
    return null;
  }
  if (row.kind === "announcement" || row.kind === "announcement-more") {
    return "announcements";
  }
  if (row.kind === "dashboard" && row.notification?.body) {
    return notificationCategoryForBody(row.notification.body);
  }
  return null;
}

export function countNotificationCategories(panelRows) {
  const counts = new Map();
  for (const row of panelRows ?? []) {
    const key = notificationCategoryForPanelRow(row);
    if (!key) {
      continue;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function availableNotificationFilters(panelRows) {
  const counts = countNotificationCategories(panelRows);
  return NOTIFICATION_FILTER_CATEGORY_ORDER.filter((key) => (counts.get(key) ?? 0) > 0);
}

export function filterPanelRowsByCategory(panelRows, categoryKey) {
  if (!categoryKey) {
    return panelRows ?? [];
  }
  return (panelRows ?? []).filter(
    (row) => notificationCategoryForPanelRow(row) === categoryKey,
  );
}
