import { useMemo } from "react";
import { useStorageState } from "react-use-storage-state";
import { useStore } from "../stores";
import { ANNOUNCEMENT_BELL_CAP, useAnnouncementUnread } from "./useAnnouncementUnread";

export function useUnreadNews() {
  const news = useStore((state) => state.news);
  const globalMe = useStore((state) => state.globalMe);
  const [newsLastSeen, setNewsLastSeen] = useStorageState("news-last-seen", 0);
  const {
    hasUnreadAnnouncements,
    unreadItemsForBell,
    unreadOverflowCount,
    unreadAnnouncementCount,
    enabled,
  } = useAnnouncementUnread();

  const maxNews = useMemo(() => {
    if (news !== undefined && news !== null && news.length > 0) {
      return Math.max(...news.map((n) => n.time ?? n.publishedAt));
    }
    return Infinity;
  }, [news]);

  const guestUnreadItems = useMemo(() => {
    if (globalMe?.id || !news?.length) {
      return [];
    }
    return news
      .filter((n) => (n.publishedAt ?? n.time ?? 0) > newsLastSeen)
      .slice(0, ANNOUNCEMENT_BELL_CAP);
  }, [globalMe?.id, news, newsLastSeen]);

  const guestUnreadCount = useMemo(() => {
    if (globalMe?.id || !news?.length) {
      return 0;
    }
    return news.filter((n) => (n.publishedAt ?? n.time ?? 0) > newsLastSeen).length;
  }, [globalMe?.id, news, newsLastSeen]);

  const hasUnreadNews = globalMe?.id && enabled
    ? hasUnreadAnnouncements
    : guestUnreadCount > 0;

  const bellAnnouncementItems = globalMe?.id && enabled
    ? unreadItemsForBell
    : guestUnreadItems;

  const bellAnnouncementCount = globalMe?.id && enabled
    ? unreadAnnouncementCount
    : guestUnreadCount;

  const bellAnnouncementOverflow = globalMe?.id && enabled
    ? unreadOverflowCount
    : Math.max(0, guestUnreadCount - ANNOUNCEMENT_BELL_CAP);

  return {
    hasUnreadNews,
    maxNews,
    newsLastSeen,
    unreadAnnouncementCount: bellAnnouncementCount,
    unreadAnnouncementItems: bellAnnouncementItems,
    unreadAnnouncementOverflow: bellAnnouncementOverflow,
    setNewsLastSeen,
  };
}
