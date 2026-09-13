import {
  defaultBoardSortForKind,
  FEEDBACK_BOARD_SORT_OPTIONS,
  WISHLIST_SORT_OPTIONS,
} from "./feedbackConstants";

const BOARD_SORT_PREFIX = "feedback-board-sort:";
const ADMIN_SORT_PREFIX = "feedback-admin-sort:";

export const FEEDBACK_ADMIN_SORT_OPTIONS = ["default", "priority", "status"];

const ADMIN_ONLY_BOARD_SORT_OPTIONS = ["default", "priority", "status"];

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

export function isValidFeedbackBoardSort(kind, sortBy, { isAdmin = false } = {}) {
  if (!sortBy) {
    return false;
  }
  if (kind === "wishlist") {
    return WISHLIST_SORT_OPTIONS.includes(sortBy);
  }
  if (kind === "bug" || kind === "feature") {
    if (FEEDBACK_BOARD_SORT_OPTIONS.includes(sortBy)) {
      return true;
    }
    return isAdmin && ADMIN_ONLY_BOARD_SORT_OPTIONS.includes(sortBy);
  }
  return false;
}

export function isValidFeedbackAdminSort(sortBy) {
  return FEEDBACK_ADMIN_SORT_OPTIONS.includes(sortBy);
}

export function getStoredFeedbackBoardSort(kind, { isAdmin = false } = {}) {
  const stored = readStorage(`${BOARD_SORT_PREFIX}${kind}`);
  if (stored && isValidFeedbackBoardSort(kind, stored, { isAdmin })) {
    return stored;
  }
  return defaultBoardSortForKind(kind);
}

export function setStoredFeedbackBoardSort(kind, sortBy) {
  if (!isValidFeedbackBoardSort(kind, sortBy, { isAdmin: true })) {
    return;
  }
  writeStorage(`${BOARD_SORT_PREFIX}${kind}`, sortBy);
}

export function getStoredFeedbackAdminSort(kind) {
  const stored = readStorage(`${ADMIN_SORT_PREFIX}${kind}`);
  if (stored && isValidFeedbackAdminSort(stored)) {
    return stored;
  }
  return "default";
}

export function setStoredFeedbackAdminSort(kind, sortBy) {
  if (!isValidFeedbackAdminSort(sortBy)) {
    return;
  }
  writeStorage(`${ADMIN_SORT_PREFIX}${kind}`, sortBy);
}
