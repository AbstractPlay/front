import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
import LocalizedTimeAgo from "./LocalizedTimeAgo";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { useStorageState } from "react-use-storage-state";
import PageHelmet from "./PageHelmet";
import { useStore } from "../stores";

function NewsArticle({ item, className }) {
  return (
    <article className={className ? `media ${className}` : "media"}>
      <div className="media-content">
        <div className="content">
          <p>
            <small>
              <LocalizedTimeAgo date={item.time} timeStyle="twitter-now" />
            </small>
          </p>
        </div>
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
          {item.text}
        </ReactMarkdown>
      </div>
    </article>
  );
}

function News() {
  const { t } = useTranslation();
  const news = useStore((state) => state.news);
  const [newsLastSeen, setNewsLastSeen] = useStorageState("news-last-seen", 0);
  const seenAtMountRef = useRef(newsLastSeen);

  useEffect(() => {
    if (news !== null && news.length > 0) {
      setNewsLastSeen(Math.max(...news.map((n) => n.time)));
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
      if (item.time > cutoff) {
        fresh.push(item);
      } else {
        older.push(item);
      }
    }
    return { newItems: fresh, olderItems: older };
  }, [news]);

  if (!news || news.length === 0) {
    return (
      <article>
        <Spinner />
      </article>
    );
  }

  return (
    <>
      <PageHelmet title="News">
        <meta property="og:url" content={`https://play.abstractplay.com/news`} />
        <meta
          property="og:description"
          content={`Copy of the #announcements channel from our Discord (https://discord.abstractplay.com)`}
        />
      </PageHelmet>
      <article>
        <div className="content">
          <h1 className="has-text-centered title">{t("News")}</h1>
          <p>
            The authoritative and most up-to-date source of Abstract Play news
            is{" "}
            <a
              href="https://discord.abstractplay.com"
              target="blank"
              rel="noreferer"
            >
              our Discord server
            </a>
            . Please come join us! This list is maintained separately, doesn't
            include images and reactions, and may be slightly delayed. Also
            available as an <a href="/news.rss">RSS feed</a>!
          </p>
        </div>
        <div className="columns">
          <div className="column is-three-fifths is-offset-one-fifth">
            {newItems.length > 0 ? (
              <>
                <h2 className="subtitle lined">
                  <span>{t("news.whatsNew")}</span>
                </h2>
                {newItems.map((item, idx) => (
                  <NewsArticle
                    key={`news-new-${item.time}-${idx}`}
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
                {olderItems.map((item, idx) => (
                  <NewsArticle
                    key={`news-older-${item.time}-${idx}`}
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
