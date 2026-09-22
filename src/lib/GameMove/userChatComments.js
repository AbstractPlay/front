/** In-game chat rows with no author are system log lines (e.g. pie seat switch). */
export function isUserChatComment(comment) {
  if (!comment || comment.system === true) {
    return false;
  }
  const userId = comment.userId;
  return userId !== null && userId !== undefined && String(userId).length > 0;
}

export function getLatestUserChatTimestamp(comments) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return 0;
  }
  return comments.reduce((max, comment) => {
    if (!isUserChatComment(comment)) {
      return max;
    }
    return Math.max(max, comment?.timeStamp ?? 0);
  }, 0);
}

/** Latest player chat timestamp from opponents (excludes myUserId when set). */
export function getLatestOpponentChatTimestamp(comments, myUserId) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return 0;
  }
  const me =
    myUserId !== null && myUserId !== undefined && String(myUserId).length > 0
      ? String(myUserId)
      : null;
  return comments.reduce((max, comment) => {
    if (!isUserChatComment(comment)) {
      return max;
    }
    if (me !== null && String(comment.userId) === me) {
      return max;
    }
    return Math.max(max, comment?.timeStamp ?? 0);
  }, 0);
}
