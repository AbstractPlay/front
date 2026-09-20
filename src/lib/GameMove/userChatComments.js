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
