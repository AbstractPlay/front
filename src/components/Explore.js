import { useState, useEffect, useCallback } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { useStorageState } from "react-use-storage-state";
import { callAuthApi } from "../lib/api";
import { API_ENDPOINT_OPEN } from "../config";
import { Helmet } from "react-helmet-async";
import MetaItem from "./MetaContainer/MetaItem";
import ExploreView from "./Explore/ExploreView";
import { viewConfigs } from "./Explore/exploreViewConfigs";
import { useStore } from "../stores";

function Explore(props) {
  const globalMe = useStore((state) => state.globalMe);
  const [counts, countsSetter] = useState(null);
  const [selected, selectedSetter] = useStorageState("selected-module", "all");
  const { metaGame } = useParams();
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  const components = [
    ["all", viewConfigs.all],
    ["newest", viewConfigs.newest],
    ["hotRaw", viewConfigs.hotRaw],
    ["hotPlayers", viewConfigs.hotPlayers],
    ["playerSum", viewConfigs.playerSum],
    ["hindex", viewConfigs.hindex],
    ["stars", viewConfigs.stars],
    ["completed", viewConfigs.completed],
    ["completedRecent", viewConfigs.completedRecent],
    ["random", viewConfigs.random],
  ];

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "meta_games");
        const res = await fetch(url);
        const result = await res.json();
        countsSetter(result);
      } catch (error) {
        countsSetter(null);
        console.log(error);
      }
    }
    fetchData();
  }, []);

  const toggleStar = useCallback(
    async (game) => {
      const { setGlobalMe, globalMe } = useStore.getState();
      try {
        const res = await callAuthApi("toggle_star", {
          metaGame: game,
        });
        if (!res) return;
        if (res.status !== 200) {
          const result = await res.json();
          console.log(
            `An error occurred while saving toggling a star:\n${result}`
          );
        } else {
          const result = await res.json();
          const newMe = JSON.parse(JSON.stringify(globalMe));
          newMe.stars = JSON.parse(result.body);
          setGlobalMe(newMe);
          // update counts locally
          const newcounts = JSON.parse(JSON.stringify(counts));
          if (
            newMe !== null &&
            "stars" in newMe &&
            Array.isArray(newMe.stars)
          ) {
            if (newMe.stars.includes(game)) {
              newcounts[game].stars++;
            } else {
              newcounts[game].stars--;
            }
          }
          countsSetter(newcounts);
        }
      } catch (error) {
        console.log(error);
      }
    },
    [counts]
  );

  const handleNewChallenge = async (challenge) => {
    try {
      await callAuthApi("new_challenge", {
        ...challenge,
        challenger: { id: globalMe.id, name: globalMe.name },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelChange = useCallback(
    (sel) => {
      selectedSetter(sel);
    },
    [selectedSetter]
  );

  if (
    metaGame === undefined ||
    metaGame === null ||
    !gameinfo.has(metaGame) ||
    (process.env.REACT_APP_REAL_MODE === "production" &&
      gameinfo.get(metaGame)?.flags?.includes("experimental"))
  ) {
    return (
      <>
        <Helmet>
          <meta property="og:title" content="Explore available games" />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/explore"
          />
          <meta
            property="og:description"
            content="Different ways of exploring what's popular on Abstract Play."
          />
        </Helmet>
        <article>
          <div
            className="container has-text-centered"
            style={{ paddingBottom: "1em" }}
          >
            <h1 className="title">{t("ExploreGames")}</h1>
          </div>
          <div className="content">
            <p>
              This page lets you explore different ways of sorting the list of
              games. Select your desired view below. Clicking on a game's name
              will take you to that game's landing page with additional
              information.
            </p>
          </div>
          <div className="container">
            <div className="control">
              <div className="select">
                <select onChange={(e) => handleSelChange(e.target.value)}>
                  {components.map(([key, cfg]) => (
                    <option key={key} value={key} selected={selected === key}>
                      {cfg.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <hr />
          {components.map(([key, cfg]) =>
            selected === key ? (
              <ExploreView
                key={key}
                viewKey={key}
                config={cfg}
                toggleStar={toggleStar}
                counts={counts}
                handleChallenge={key === "all" ? handleNewChallenge : undefined}
              />
            ) : null
          )}
        </article>
      </>
    );
  } else if (counts !== null) {
    return (
      <>
        <Helmet>
          <meta
            property="og:title"
            content={`${gameinfo.get(metaGame).name}: Game Information`}
          />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/games"
          />
          <meta
            property="og:description"
            content={`Information on the game ${gameinfo.get(metaGame).name}`}
          />
        </Helmet>
        <MetaItem
          game={gameinfo.get(metaGame)}
          counts={counts[metaGame]}
          toggleStar={toggleStar}
          handleChallenge={handleNewChallenge}
        />
      </>
    );
  }
}

export default Explore;
