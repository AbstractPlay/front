import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Spinner from "./Spinner";
import { useStorageState } from "react-use-storage-state";
import PageHelmet from "./PageHelmet";
import { useStore } from "../stores";
import AnnouncementArticle from "./Announcements/AnnouncementArticle";
import { announcementsLastReadAt, announcementsCursorIsUnset } from "../hooks/useAnnouncementUnread";
import { useMarkAnnouncementsRead } from "../hooks/useMarkAnnouncementsRead";
import { useNewsFeed } from "../hooks/useNewsFeed";
import { useVisibleAnnouncementReactions } from "../hooks/useVisibleAnnouncementReactions";
import { reactToAnnouncement } from "../lib/announcements/announcementEngagementApi";
import "./Announcements/announcement.css";

function News() {
  const { t } = useTranslation();
  const { announcementId: routeAnnouncementId } = useParams();
  const globalMe = useStore((state) => state.globalMe);
  const [newsLastSeen, setNewsLastSeen] = useStorageState("news-last-seen", 0);
  const seenAtMountRef = useRef(null);
  if (seenAtMountRef.current === null) {
    if (!globalMe?.id) {
      seenAtMountRef.current = newsLastSeen;
    } else if (announcementsCursorIsUnset(globalMe)) {
      seenAtMountRef.current = Number.MAX_SAFE_INTEGER;
    } else {
      const cursor = announcementsLastReadAt(globalMe);
      seenAtMountRef.current = cursor ?? newsLastSeen;
    }
  }
  const markAnnouncementsRead = useMarkAnnouncementsRead();
  const {
    items: feedItems,
    status: feedStatus,
    error: feedError,
    loadMore,
    hasMore,
    loadingMore,
    ensureAnnouncementLoaded,
    updateItem,
    feedEpoch,
  } = useNewsFeed();
  const {
    reactionsById,
    setReactionsById,
    articleRef,
  } = useVisibleAnnouncementReactions(Boolean(globalMe?.id));
  const [reactionBusy, setReactionBusy] = useState(false);
  const loadMoreSentinelRef = useRef(null);
  const [deepLinkScrollReady, setDeepLinkScrollReady] = useState(!routeAnnouncementId);
  const deepLinkScrolledIdRef = useRef(null);

  useEffect(() => {
    if (!routeAnnouncementId) {
      setDeepLinkScrollReady(true);
      deepLinkScrolledIdRef.current = null;
      return;
    }
    deepLinkScrolledIdRef.current = null;
    setDeepLinkScrollReady(false);
  }, [routeAnnouncementId, feedEpoch]);

  useEffect(() => {
    if (!routeAnnouncementId) {
      return;
    }
    ensureAnnouncementLoaded(routeAnnouncementId);
  }, [ensureAnnouncementLoaded, routeAnnouncementId]);

  useEffect(() => {
    if (!feedItems.length) {
      return;
    }
    if (globalMe?.id) {
      const maxTs = Math.max(...feedItems.map((n) => n.time ?? n.publishedAt ?? 0));
      markAnnouncementsRead(maxTs);
      return;
    }
    setNewsLastSeen(Math.max(...feedItems.map((n) => n.time ?? n.publishedAt)));
  }, [feedItems, globalMe?.id, markAnnouncementsRead, setNewsLastSeen]);

  useEffect(() => {
    if (!routeAnnouncementId) {
      return;
    }
    if (deepLinkScrolledIdRef.current === routeAnnouncementId) {
      return;
    }
    if (!feedItems.some((item) => item.id === routeAnnouncementId)) {
      return;
    }
    const el = document.getElementById(`announcement-${routeAnnouncementId}`);
    if (!el) {
      return;
    }
    let outerFrame;
    let innerFrame;
    outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        deepLinkScrolledIdRef.current = routeAnnouncementId;
        setDeepLinkScrollReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      if (innerFrame !== undefined) {
        cancelAnimationFrame(innerFrame);
      }
    };
  }, [routeAnnouncementId, feedItems, feedEpoch]);

  useEffect(() => {
    const node = loadMoreSentinelRef.current;
    if (!node || !hasMore || feedStatus !== "ready" || !deepLinkScrollReady) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [deepLinkScrollReady, feedStatus, hasMore, loadMore]);

  const handleReactionToggle = useCallback(async (id, emoji) => {
    setReactionBusy(true);
    const result = await reactToAnnouncement(id, emoji);
    setReactionBusy(false);
    if (!result.ok) {
      return;
    }
    setReactionsById((prev) => ({
      ...prev,
      [id]: result.data.myReactions ?? [],
    }));
    updateItem(id, { reactionCounts: result.data.reactionCounts ?? {} });
    const setNews = useStore.getState().setNews;
    setNews((items) => items.map((item) => (
      item.id === id
        ? { ...item, reactionCounts: result.data.reactionCounts ?? item.reactionCounts }
        : item
    )));
  }, [setReactionsById, updateItem]);

  const { newItems, olderItems } = useMemo(() => {
    if (!feedItems.length) {
      return { newItems: [], olderItems: [] };
    }
    const cutoff = seenAtMountRef.current;
    const fresh = [];
    const older = [];
    for (const item of feedItems) {
      const ts = item.time ?? item.publishedAt;
      if (ts > cutoff) {
        fresh.push(item);
      } else {
        older.push(item);
      }
    }
    return { newItems: fresh, olderItems: older };
  }, [feedItems]);

  const renderArticle = (item, className) => (
    <AnnouncementArticle
      key={item.id}
      item={item}
      className={className}
      showReactions
      myReactions={reactionsById[item.id] ?? []}
      onReactionToggle={handleReactionToggle}
      reactionsDisabled={reactionBusy}
      articleRef={articleRef}
      showCopyLink
    />
  );

  if (feedStatus === "loading" && feedItems.length === 0) {
    return (
      <article>
        <Spinner />
      </article>
    );
  }

  if (feedStatus === "error" && feedItems.length === 0) {
    return (
      <article className="content">
        <h1 className="has-text-centered title">{t("News")}</h1>
        <p className="has-text-centered">{feedError || t("news.loadError")}</p>
      </article>
    );
  }

  if (feedItems.length === 0) {
    return (
      <article className="content">
        <h1 className="has-text-centered title">{t("News")}</h1>
        <p className="has-text-centered">{t("news.empty")}</p>
      </article>
    );
  }

  return (
    <>
      <PageHelmet title="News">
        <meta property="og:url" content={`https://play.abstractplay.com/news`} />
        <meta property="og:description" content={t("news.ogDescription")} />
      </PageHelmet>
      <article>
        <div className="content">
          <h1 className="has-text-centered title">{t("News")}</h1>
          <p>
            <Trans
              i18nKey="news.intro"
              components={{
                discordLink: (
                  // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans children
                  <a
                    href="https://discord.abstractplay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans children
                rssLink: <a href="/news.rss" />,
              }}
            />
          </p>
        </div>
        <div className="columns">
          <div className="column is-three-fifths is-offset-one-fifth">
            {newItems.length > 0 ? (
              <>
                <h2 className="subtitle lined">
                  <span>{t("news.whatsNew")}</span>
                </h2>
                {newItems.map((item) => renderArticle(item, "news-item-new"))}
              </>
            ) : null}
            {olderItems.length > 0 ? (
              <>
                {newItems.length > 0 ? (
                  <h2 className="subtitle lined">
                    <span>{t("news.earlier")}</span>
                  </h2>
                ) : null}
                {olderItems.map((item) => renderArticle(item))}
              </>
            ) : null}
            {hasMore ? (
              <div className="has-text-centered news-feed-more">
                <div ref={loadMoreSentinelRef} className="news-feed-sentinel" aria-hidden="true" />
                {loadingMore ? (
                  <p className="news-feed-loading">{t("news.loadingMore")}</p>
                ) : (
                  <button
                    type="button"
                    className="button apButtonNeutral news-feed-load-older"
                    onClick={() => loadMore()}
                  >
                    {t("news.loadOlder")}
                  </button>
                )}
              </div>
            ) : null}
            {feedError ? (
              <p className="has-text-centered news-feed-error">{feedError}</p>
            ) : null}
          </div>
        </div>
      </article>
    </>
  );
}

export default News;
