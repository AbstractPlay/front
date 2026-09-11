const STORAGE_PREFIX = "feedback-last-seen-";

export function markFeedbackSeen(postId, updatedAt) {
  if (!postId || !Number.isFinite(updatedAt)) {
    return;
  }
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${postId}`, String(updatedAt));
  } catch {
    // ignore quota / private mode
  }
}

export function getFeedbackLastSeen(postId) {
  if (!postId) {
    return 0;
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${postId}`);
    if (!raw) {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function isFeedbackUnread(item) {
  if (!item?.id || !Number.isFinite(item.updatedAt)) {
    return false;
  }
  return item.updatedAt > getFeedbackLastSeen(item.id);
}
