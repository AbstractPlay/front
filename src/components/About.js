import React, { useEffect, Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";
// import pkgInfo from "../../package.json";
import { Link } from "react-router-dom";
import { shuffle } from "../lib/shuffle";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Thumbnail from "./Thumbnail";

function About(props) {
  const [mvTimes, mvTimesSetter] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

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
      const selected = shuffle([...metas]).slice(0, num);
      const deets = [];
      selected.forEach((metaGame) => {
        const info = gameinfo.get(metaGame);
        if (!info) return; // Skip if game info not found
        let gameEngine;
        if (info.playercounts && info.playercounts.length > 1) {
          gameEngine = GameFactory(metaGame, 2);
        } else {
          gameEngine = GameFactory(metaGame);
        }
        deets.push({
          metaGame,
          name: info.name,
          description: gameEngine.description(),
          designers:
            info.people !== undefined && info.people.length > 0
              ? info.people.filter((p) => p.type === "designer")
              : [],
        });
      });
      setHighlights(deets);
    }
  }, [mvTimes]);

  return (
    <Fragment>
      <article className="content">
        <h1 className="has-text-centered title">{t("About")}</h1>
        <p>
          Abstract Play is a place to play abstract strategy games against
          others asynchronously (you don't have to be online at the same time).
          We specialize in offbeat, perfect information games without any
          element of luck, but we also include a number of games that involve
          randomness (e.g., dice and cards).
        </p>
        <p>
          The site is completely free to join and play. We thank our corporate
          sponsor, <a href="https://store.looneylabs.com/">Looney Labs</a>, for
          helping us keep the lights on!
        </p>
        {/* <p style={{ fontSize: "smaller", textAlign: "right" }}>
          Build: {pkgInfo.version}
        </p> */}
        {highlights === null ? null : (
          <p>
            Here are some of the most active games this week. Visit the{" "}
            <Link to="/games">full games list</Link> for more details.
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
