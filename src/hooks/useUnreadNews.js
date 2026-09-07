import { useMemo } from "react";
import { useStorageState } from "react-use-storage-state";
import { useStore } from "../stores";

export function useUnreadNews() {
  const news = useStore((state) => state.news);
  const [newsLastSeen] = useStorageState("news-last-seen", 0);

  const maxNews = useMemo(() => {
    if (news !== undefined && news !== null && news.length > 0) {
      return Math.max(...news.map((n) => n.time));
    }
    return Infinity;
  }, [news]);

  const hasUnreadNews = newsLastSeen < maxNews;

  return { hasUnreadNews, maxNews, newsLastSeen };
}
