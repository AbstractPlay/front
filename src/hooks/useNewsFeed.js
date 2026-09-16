import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../stores";
import {
  announcementToNewsItem,
  enrichAnnouncementAttachmentUrls,
  fetchAnnouncementsList,
  fetchAnnouncementGet,
} from "../lib/announcements/announcementApi";
import {
  ANNOUNCEMENT_FEED_PAGE_SIZE,
  computeInitialPublishedAfter,
} from "../lib/announcements/announcementFeedConfig";

function mergeById(existing, incoming) {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return [...byId.values()].sort(
    (a, b) => (b.publishedAt ?? b.time ?? 0) - (a.publishedAt ?? a.time ?? 0),
  );
}

function oldestPublishedAt(items) {
  if (!items.length) {
    return null;
  }
  return Math.min(...items.map((n) => n.publishedAt ?? n.time ?? 0));
}

/**
 * Paginated /news feed: initial window from cursor buffer, then cursor pages, then older archive.
 */
export function useNewsFeed() {
  const globalMe = useStore((state) => state.globalMe);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(undefined);
  const [phase, setPhase] = useState("window");
  const [loadingMore, setLoadingMore] = useState(false);
  const [archiveExhausted, setArchiveExhausted] = useState(false);
  const initialAfterRef = useRef(null);

  const loadPage = useCallback(async ({
    cursor,
    publishedAfter,
    publishedBefore,
    append,
  }) => {
    const list = await fetchAnnouncementsList({
      limit: ANNOUNCEMENT_FEED_PAGE_SIZE,
      cursor,
      publishedAfter,
      publishedBefore,
    });
    if (!list.ok) {
      return { ok: false, error: list.error };
    }
    const raw = list.data.items ?? [];
    const enriched = await enrichAnnouncementAttachmentUrls(raw);
    const mapped = enriched.map(announcementToNewsItem);
    setItems((prev) => (append ? mergeById(prev, mapped) : mapped));
    const pageNext = list.data.nextCursor;
    setNextCursor(pageNext);
    return { ok: true, count: mapped.length, nextCursor: pageNext };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const publishedAfter = computeInitialPublishedAfter(globalMe);
    initialAfterRef.current = publishedAfter;
    setPhase("window");
    setNextCursor(undefined);
    setArchiveExhausted(false);
    setItems([]);
    setError(null);
    setStatus("loading");
    (async () => {
      const result = await loadPage({ publishedAfter, append: false });
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset feed on login/logout only (not on mark-read)
  }, [globalMe?.id, loadPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || status === "loading" || archiveExhausted) {
      return;
    }
    setLoadingMore(true);
    setError(null);
    try {
      if (nextCursor) {
        const publishedAfter =
          phase === "window" ? initialAfterRef.current : undefined;
        const result = await loadPage({
          cursor: nextCursor,
          publishedAfter,
          append: true,
        });
        if (!result.ok) {
          setError(result.error);
        }
        return;
      }
      const before = oldestPublishedAt(items);
      if (before === null) {
        setArchiveExhausted(true);
        return;
      }
      if (phase === "window") {
        setPhase("archive");
        setNextCursor(undefined);
      }
      const result = await loadPage({
        publishedBefore: before,
        append: true,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.count === 0 && !result.nextCursor) {
        setArchiveExhausted(true);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [archiveExhausted, items, loadPage, loadingMore, nextCursor, phase, status]);

  const ensureAnnouncementLoaded = useCallback(async (id) => {
    if (!id || items.some((n) => n.id === id)) {
      return;
    }
    const got = await fetchAnnouncementGet(id);
    if (!got.ok) {
      return;
    }
    const row = got.data;
    const enriched = await enrichAnnouncementAttachmentUrls([{
      id: row.id,
      title: row.title,
      body: row.body,
      publishedAt: row.publishedAt,
      attachmentKeys: row.attachmentKeys,
      reactionCounts: row.reactionCounts,
    }]);
    const mapped = announcementToNewsItem(enriched[0]);
    mapped.attachmentUrlByKey = enriched[0].attachmentUrlByKey ?? mapped.attachmentUrlByKey;
    setItems((prev) => mergeById(prev, [mapped]));
  }, [items]);

  const hasMore = !archiveExhausted && (Boolean(nextCursor) || items.length > 0);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((item) => (
      item.id === id ? { ...item, ...patch } : item
    )));
  }, []);

  return {
    items,
    status,
    error,
    loadMore,
    hasMore,
    loadingMore,
    ensureAnnouncementLoaded,
    updateItem,
  };
}
