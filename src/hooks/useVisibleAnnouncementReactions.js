import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAnnouncementReactionsMine } from "../lib/announcements/announcementEngagementApi";

const REACTION_BATCH = 40;

/**
 * Fetch my reactions only for announcement articles intersecting the viewport.
 * @param {boolean} enabled
 */
export function useVisibleAnnouncementReactions(enabled) {
  const [reactionsById, setReactionsById] = useState({});
  const fetchedRef = useRef(new Set());
  const visibleRef = useRef(new Set());
  const observerRef = useRef(null);
  const inflightRef = useRef(false);

  const scheduleFetch = useCallback(() => {
    if (!enabled || inflightRef.current) {
      return;
    }
    const toFetch = [...visibleRef.current].filter((id) => !fetchedRef.current.has(id));
    if (toFetch.length === 0) {
      return;
    }
    const batch = toFetch.slice(0, REACTION_BATCH);
    for (const id of batch) {
      fetchedRef.current.add(id);
    }
    inflightRef.current = true;
    fetchAnnouncementReactionsMine(batch).then((result) => {
      inflightRef.current = false;
      if (result.ok) {
        const byId = result.data?.byAnnouncementId ?? {};
        setReactionsById((prev) => ({ ...prev, ...byId }));
      } else {
        for (const id of batch) {
          fetchedRef.current.delete(id);
        }
      }
      scheduleFetch();
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-announcement-id");
          if (!id) {
            continue;
          }
          if (entry.isIntersecting) {
            visibleRef.current.add(id);
          } else {
            visibleRef.current.delete(id);
          }
        }
        scheduleFetch();
      },
      { root: null, rootMargin: "200px 0px", threshold: 0 },
    );
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [enabled, scheduleFetch]);

  const articleRef = useCallback((element) => {
    const observer = observerRef.current;
    if (!observer) {
      return;
    }
    if (!element) {
      return;
    }
    observer.observe(element);
  }, []);

  return {
    reactionsById,
    setReactionsById,
    articleRef,
  };
}
