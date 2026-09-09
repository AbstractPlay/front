import { useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "gameMoveChatSeen:";

function getLatestChatTimestamp(comments) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return 0;
  }
  return comments.reduce(
    (max, comment) => Math.max(max, comment?.timeStamp ?? 0),
    0
  );
}

function readLastSeen(gameID) {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${gameID}`);
    if (!stored) {
      return null;
    }
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLastSeen(gameID, timestamp) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${gameID}`, String(timestamp));
  } catch {
    // ignore quota / private browsing
  }
}

/**
 * True when chat has messages newer than the last time the user viewed the tab.
 */
export function useDrawerChatUnread(session, { tab, open }) {
  const { gameID, chatComments } = session;
  const latest = getLatestChatTimestamp(chatComments);
  const [lastSeen, setLastSeen] = useState(() => readLastSeen(gameID) ?? 0);
  const seededRef = useRef(readLastSeen(gameID) !== null);
  const chatVisible = open && tab === "chat";

  useEffect(() => {
    const stored = readLastSeen(gameID);
    seededRef.current = stored !== null;
    setLastSeen(stored ?? 0);
  }, [gameID]);

  useEffect(() => {
    if (seededRef.current) {
      return;
    }
    if (latest <= 0) {
      return;
    }
    writeLastSeen(gameID, latest);
    setLastSeen(latest);
    seededRef.current = true;
  }, [gameID, latest]);

  useEffect(() => {
    if (!chatVisible || latest <= 0) {
      return;
    }
    writeLastSeen(gameID, latest);
    setLastSeen(latest);
    seededRef.current = true;
  }, [chatVisible, gameID, latest]);

  return !chatVisible && latest > lastSeen;
}
