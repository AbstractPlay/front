import React, { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "./Spinner";
// import i18n from "../i18n";
import ReactTimeAgo from "react-time-ago";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { NewsContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";

function News(props) {
  const { t } = useTranslation();
  const [news] = useContext(NewsContext);
  const [, setNewsLastSeen] = useStorageState("news-last-seen", 0);

  useEffect(() => {
    if (news !== null && news.length > 0) {
      setNewsLastSeen(Math.max(...news.map((n) => n.time)));
    }
  }, [setNewsLastSeen, news]);

  if (!news || news.length === 0) {
    return (
      <article>
        <Spinner />
      </article>
    );
  } else {
    return (
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
            . Please come join us! This list is maintained separately, only
            includes a subset of the announcements, and may be slightly delayed.
          </p>
        </div>
        <div className="columns">
          <div className="column is-three-fifths is-offset-one-fifth">
            {news.map((item, idx) => (
              <article className="media" key={`news-media-${idx}`}>
                <div className="media-content">
                  <div className="content">
                    <p>
                      <small>
                        <ReactTimeAgo
                          date={item.time}
                          timeStyle="twitter-now"
                        />
                      </small>
                    </p>
                  </div>
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    className="content"
                  >
                    {item.text}
                  </ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        </div>
      </article>
    );
  }
}

export default News;
