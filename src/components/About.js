import React, { useEffect, Fragment, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
// import pkgInfo from "../../package.json";
import { Link } from "react-router-dom";
import { shuffle } from "../lib/shuffle";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Thumbnail from "./Thumbnail";

function About(props) {
  const [mvTimes, mvTimesSetter] = useState(null);
  const [highlightMetas, setHighlightMetas] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/mvtimes.json");
        const res = await fetch(url);
        const result = await res.json();
        mvTimesSetter(result);
      } catch (error) {
        console.log(error);
        mvTimesSetter(null);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (mvTimes !== null) {
      const num = 5;
      const top = 20;
      const metas = new Set();
      const sortedMvs = [...mvTimes.raw1w].sort((a, b) => b.score - a.score);
      const sortedPs = [...mvTimes.players1w].sort((a, b) => b.score - a.score);
      sortedMvs.slice(0, top).forEach((e) => metas.add(e.metaGame));
      sortedPs.slice(0, top).forEach((e) => metas.add(e.metaGame));
      setHighlightMetas(shuffle([...metas]).slice(0, num));
    }
  }, [mvTimes]);

  const highlights = useMemo(() => {
    if (highlightMetas === null) return null;
    return highlightMetas
      .map((metaGame) => {
        const info = gameinfo.get(metaGame);
        if (!info) return null;
        let gameEngine;
        if (info.playercounts && info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        return {
          metaGame,
          name: info.name,
          description: gameEngine.description(),
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
        };
      })
      .filter(Boolean);
  }, [highlightMetas, t]);

  return (
    <Fragment>
      <article className="content">
        <h1 className="has-text-centered title">{t("About")}</h1>
        <p>{t("about.intro")}</p>
        {/* <p style={{ fontSize: "smaller", textAlign: "right" }}>
          Build: {pkgInfo.version}
        </p> */}
        {highlights === null ? null : (
          <p>
            <Trans i18nKey="about.highlights">
              Here are some of the most active games this week. Visit the{" "}
              <Link to="/games">{t("about.highlightsLink")}</Link> for more
              details.
            </Trans>
          </p>
        )}
      </article>
      {highlights === null ? null : (
        <>
          <div className="columns is-multiline">
            {highlights.map((e, idx) => {
              return (
                <div
                  className="column"
                  key={`higlight|${idx}`}
                  style={{ fontSize: "smaller" }}
                >
                  <h1 className="subtitle">
                    <Link to={`/games/${e.metaGame}`}>{e.name}</Link>
                  </h1>
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    className="content"
                  >
                    {e.description}
                  </ReactMarkdown>
                  <div>
                    <Thumbnail meta={e.metaGame} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Fragment>
  );
}

export default About;
