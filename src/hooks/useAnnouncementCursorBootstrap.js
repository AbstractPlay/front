import { useEffect, useRef } from "react";
import { useStore } from "../stores";
import { announcementsCursorIsUnset, maxPublishedAt } from "./useAnnouncementUnread";
import { useMarkAnnouncementsRead } from "./useMarkAnnouncementsRead";

/**
 * First login after announcements cursor ships: baseline to current feed (no historical bell flood).
 */
export function useAnnouncementCursorBootstrap() {
  const globalMe = useStore((state) => state.globalMe);
  const news = useStore((state) => state.news);
  const newsLoadState = useStore((state) => state.newsLoadState);
  const markRead = useMarkAnnouncementsRead();
  const bootstrappingRef = useRef(false);

  useEffect(() => {
    if (!globalMe?.id || newsLoadState !== "ready" || news === null) {
      return;
    }
    if (!announcementsCursorIsUnset(globalMe)) {
      return;
    }
    if (bootstrappingRef.current) {
      return;
    }
    bootstrappingRef.current = true;
    const readAt = maxPublishedAt(news) ?? Date.now();
    markRead(readAt).finally(() => {
      bootstrappingRef.current = false;
    });
  }, [globalMe, globalMe?.settings?.all?.announcementsLastReadAt, markRead, news, newsLoadState]);
}
