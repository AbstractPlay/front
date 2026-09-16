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
import {
  fetchAnnouncementReactionsMine,
  reactToAnnouncement,
} from "../lib/announcements/announcementEngagementApi";
import "./Announcements/announcement.css";

function News() {
  const { t } = useTranslation();
  const { announcementId: routeAnnouncementId } = useParams();
  const globalMe = useStore((state) => state.globalMe);
  const news = useStore((state) => state.news);
  const newsLoadState = useStore((state) => state.newsLoadState);
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
  const [reactionsById, setReactionsById] = useState({});
  const [reactionBusy, setReactionBusy] = useState(false);

  useEffect(() => {
    if (!globalMe?.id || !news || news.length === 0) {
      return;
    }
    const ids = news.map((n) => n.id).filter(Boolean);
    let cancelled = false;
    (async () => {
      const result = await fetchAnnouncementReactionsMine(ids);
      if (!cancelled && result.ok) {
        setReactionsById(result.data?.byAnnouncementId ?? {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [globalMe?.id, news]);

  useEffect(() => {
    if (!news || news.length === 0) {
      return;
    }
    if (globalMe?.id) {
      const maxTs = Math.max(...news.map((n) => n.time ?? n.publishedAt ?? 0));
      markAnnouncementsRead(maxTs);
      return;
    }
    setNewsLastSeen(Math.max(...news.map((n) => n.time ?? n.publishedAt)));
  }, [globalMe?.id, markAnnouncementsRead, news, setNewsLastSeen]);

  useEffect(() => {
    if (!routeAnnouncementId) {
      return;
    }
    const el = document.getElementById(`announcement-${routeAnnouncementId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [routeAnnouncementId, news]);

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
    const setNews = useStore.getState().setNews;
    setNews((items) => items.map((item) => (
      item.id === id
        ? { ...item, reactionCounts: result.data.reactionCounts ?? item.reactionCounts }
        : item
    )));
  }, []);

  const { newItems, olderItems } = useMemo(() => {
    if (!news || news.length === 0) {
      return { newItems: [], olderItems: [] };
    }
    const cutoff = seenAtMountRef.current;
    const fresh = [];
    const older = [];
    for (const item of news) {
      const ts = item.time ?? item.publishedAt;
      if (ts > cutoff) {
        fresh.push(item);
      } else {
        older.push(item);
      }
    }
    return { newItems: fresh, olderItems: older };
  }, [news]);

  const renderArticle = (item, className) => (
    <AnnouncementArticle
      key={item.id}
      item={item}
      className={className}
      showReactions
      myReactions={reactionsById[item.id] ?? []}
      onReactionToggle={handleReactionToggle}
      reactionsDisabled={reactionBusy}
    />
  );

  if (newsLoadState === "loading" || news === null) {
    return (
      <article>
        <Spinner />
      </article>
    );
  }

  if (news.length === 0) {
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
          </div>
        </div>
      </article>
    </>
  );
}

export default News;
