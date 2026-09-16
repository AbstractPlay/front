import { useMemo } from "react";
import { useStore } from "../stores";

/** Max synthetic announcement rows in the bell dropdown. */
export const ANNOUNCEMENT_BELL_CAP = 10;

function inAppAnnouncementsEnabled(globalMe) {
  const prefs = globalMe?.settings?.all?.inAppNotifications;
  if (!prefs || prefs.announcements === undefined) {
    return true;
  }
  return prefs.announcements === true;
}

export function announcementsCursorIsUnset(globalMe) {
  if (!globalMe?.id) {
    return false;
  }
  const all = globalMe.settings?.all;
  if (!all || typeof all !== "object") {
    return true;
  }
  return all.announcementsLastReadAt === undefined || all.announcementsLastReadAt === null;
}

export function announcementsLastReadAt(globalMe) {
  if (announcementsCursorIsUnset(globalMe)) {
    return null;
  }
  const raw = globalMe?.settings?.all?.announcementsLastReadAt;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function maxPublishedAt(news) {
  if (!news || news.length === 0) {
    return null;
  }
  return Math.max(...news.map((n) => n.publishedAt ?? n.time ?? 0));
}

export function useAnnouncementUnread() {
  const globalMe = useStore((state) => state.globalMe);
  const news = useStore((state) => state.news);

  const enabled = globalMe?.id ? inAppAnnouncementsEnabled(globalMe) : false;
  const cursorUnset = announcementsCursorIsUnset(globalMe);
  const cursor = announcementsLastReadAt(globalMe);

  const unreadItems = useMemo(() => {
    if (!enabled || cursorUnset || cursor === null || !news || news.length === 0) {
      return [];
    }
    return news.filter((item) => {
      const ts = item.publishedAt ?? item.time ?? 0;
      return ts > cursor;
    });
  }, [enabled, cursor, cursorUnset, news]);

  const unreadItemsForBell = useMemo(
    () => unreadItems.slice(0, ANNOUNCEMENT_BELL_CAP),
    [unreadItems],
  );

  const unreadOverflowCount = Math.max(0, unreadItems.length - ANNOUNCEMENT_BELL_CAP);

  const hasUnreadAnnouncements = unreadItems.length > 0;

  return {
    enabled,
    cursor,
    cursorUnset,
    unreadItems,
    unreadItemsForBell,
    unreadOverflowCount,
    unreadAnnouncementCount: unreadItems.length,
    hasUnreadAnnouncements,
  };
}
