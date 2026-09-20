const STORAGE_KEY = "feedback-recent-ap-urls";
const MAX_RECENT = 10;

const FEEDBACK_NEW_PATH = "/feedback/new";

function storageAvailable() {
  return typeof sessionStorage !== "undefined";
}

export function normalizeReportedPageUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return null;
    }
    parsed.hash = "";
    return parsed.href;
  } catch {
    return null;
  }
}

function isBugFormUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname === FEEDBACK_NEW_PATH;
  } catch {
    return false;
  }
}

/**
 * Record an in-app URL the user visited (session-scoped). Call on route changes.
 */
export function recordApUrl(url) {
  const normalized = normalizeReportedPageUrl(url);
  if (!normalized || !storageAvailable()) {
    return;
  }
  let list = [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch {
    list = [];
  }
  if (!Array.isArray(list)) {
    list = [];
  }
  list = list.filter((entry) => entry !== normalized);
  list.unshift(normalized);
  if (list.length > MAX_RECENT) {
    list.length = MAX_RECENT;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // quota
  }
}

/**
 * Recent same-origin URLs for bug reports, newest first. Excludes the bug form itself.
 */
export function getRecentApUrlsForBugReport() {
  if (!storageAvailable()) {
    return [];
  }
  let list = [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch {
    return [];
  }
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((url) => typeof url === "string" && !isBugFormUrl(url));
}

/**
 * @param {string} choice - recent URL, "custom", or "none"
 * @param {string} customUrl - when choice is "custom"
 */
export function resolveReportedPageUrlForSubmit(choice, customUrl) {
  if (choice === "none" || !choice) {
    return "";
  }
  if (choice === "custom") {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      return "";
    }
    return normalizeReportedPageUrl(trimmed) ?? "";
  }
  return normalizeReportedPageUrl(choice) ?? choice;
}

/** Short label for a stored AP URL (pathname + query). */
export function formatApUrlLabel(url) {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`;
    return path || parsed.href;
  } catch {
    return url;
  }
}

const MOVE_GAME_ID_PATTERN = /^\/move\/[^/]+\/[^/]+\/([^/?#]+)/;

/** Pull game/move hints from a move URL or query string. */
export function parseGameHintsFromApUrl(url) {
  const hints = {};
  if (!url) {
    return hints;
  }
  try {
    const parsed = new URL(url, window.location.origin);
    const gameIdParam = parsed.searchParams.get("gameId");
    if (gameIdParam) {
      hints.gameId = gameIdParam;
    }
    const moveNumberParam = parsed.searchParams.get("moveNumber");
    if (moveNumberParam) {
      const moveNumber = Number(moveNumberParam);
      if (Number.isFinite(moveNumber)) {
        hints.moveNumber = moveNumber;
      }
    }
    const layoutId = parsed.searchParams.get("layoutId");
    if (layoutId) {
      hints.layoutId = layoutId;
    }
    const moveMatch = parsed.pathname.match(MOVE_GAME_ID_PATTERN);
    if (moveMatch?.[1] && !hints.gameId) {
      hints.gameId = moveMatch[1];
    }
  } catch {
    // ignore
  }
  return hints;
}
