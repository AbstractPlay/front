import {
  announcementsCursorIsUnset,
  announcementsLastReadAt,
} from "../../hooks/useAnnouncementUnread";

/** Days before last-read cursor included in bell + initial /news window (logged in). */
export const ANNOUNCEMENT_FEED_BUFFER_MS = 3 * 24 * 60 * 60 * 1000;

/** Unauthenticated initial bootstrap window. */
export const ANNOUNCEMENT_GUEST_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

/** Logged-in before server read cursor exists (bootstrap). */
export const ANNOUNCEMENT_PRE_CURSOR_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;

export const ANNOUNCEMENT_FEED_PAGE_SIZE = 20;

/**
 * @param {object | null | undefined} globalMe
 * @returns {number | undefined} ms; omit = no lower bound (full archive pagination)
 */
export function computeInitialPublishedAfter(globalMe) {
  const now = Date.now();
  if (!globalMe?.id) {
    return now - ANNOUNCEMENT_GUEST_LOOKBACK_MS;
  }
  if (announcementsCursorIsUnset(globalMe)) {
    return now - ANNOUNCEMENT_PRE_CURSOR_LOOKBACK_MS;
  }
  const cursor = announcementsLastReadAt(globalMe);
  if (cursor === null) {
    return now - ANNOUNCEMENT_PRE_CURSOR_LOOKBACK_MS;
  }
  return Math.max(0, cursor - ANNOUNCEMENT_FEED_BUFFER_MS);
}

/**
 * Lower bound for skeleton bell bootstrap (same window as logged-in /news start).
 * @param {object | null | undefined} globalMe
 */
export function computeBellPublishedAfter(globalMe) {
  return computeInitialPublishedAfter(globalMe);
}

/**
 * When null, the /news feed should wait (auth or profile still loading).
 * @returns {string | null}
 */
export function resolveNewsFeedBootstrapKey(authStatus, globalMe) {
  if (authStatus === "unknown" || authStatus === "loading") {
    return null;
  }
  if (authStatus === "guest") {
    return "guest";
  }
  if (!globalMe?.id) {
    return null;
  }
  return globalMe.id;
}
