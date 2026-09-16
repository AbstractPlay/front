import React, { useEffect, useMemo, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import { useStorageState } from "react-use-storage-state";
import PageHelmet from "./PageHelmet";
import { useStore } from "../stores";
import AnnouncementArticle from "./Announcements/AnnouncementArticle";
import "./Announcements/announcement.css";

function News() {
  const { t } = useTranslation();
  const news = useStore((state) => state.news);
  const newsLoadState = useStore((state) => state.newsLoadState);
  const [newsLastSeen, setNewsLastSeen] = useStorageState("news-last-seen", 0);
  const seenAtMountRef = useRef(newsLastSeen);

  useEffect(() => {
    if (news !== null && news.length > 0) {
      setNewsLastSeen(Math.max(...news.map((n) => n.time ?? n.publishedAt)));
    }
  }, [setNewsLastSeen, news]);

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
                // Trans injects visible link text from news.intro
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
                {newItems.map((item) => (
                  <AnnouncementArticle
                    key={`news-new-${item.id}`}
                    item={item}
                    className="news-item-new"
                  />
                ))}
              </>
            ) : null}
            {olderItems.length > 0 ? (
              <>
                {newItems.length > 0 ? (
                  <h2 className="subtitle lined">
                    <span>{t("news.earlier")}</span>
                  </h2>
                ) : null}
                {olderItems.map((item) => (
                  <AnnouncementArticle
                    key={`news-older-${item.id}`}
                    item={item}
                  />
                ))}
              </>
            ) : null}
          </div>
        </div>
      </article>
    </>
  );
}

export default News;
