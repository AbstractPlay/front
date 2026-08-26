import { useState, useEffect, useCallback } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { getGameDisplayName } from "../lib/gameOptions";
import { useTranslation } from "react-i18next";
import { useParams, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useStorageState } from "react-use-storage-state";
import { callAuthApi } from "../lib/api";
import { maybeTrackRecommendationChallenge } from "../lib/recommendationAttribution";
import { API_ENDPOINT_OPEN } from "../config";
import { Helmet } from "react-helmet-async";
import MetaItem from "./MetaContainer/MetaItem";
import ExploreView from "./Explore/ExploreView";
import {
  DEFAULT_EXPLORE_VIEW,
  EXPLORE_VIEW_ORDER,
  getExploreViewConfig,
  isValidExploreView,
} from "../lib/exploreSections";
import { useStore } from "../stores";

function Explore(props) {
  const globalMe = useStore((state) => state.globalMe);
  const location = useLocation();
  const navigate = useNavigate();
  const { mode: modeParam, metaGame } = useParams();
  const isGameDetail = location.pathname.startsWith("/games/");
  const [counts, countsSetter] = useState(null);
  const [storedView, setStoredView] = useStorageState(
    "selected-module",
    DEFAULT_EXPLORE_VIEW
  );
  const { t } = useTranslation();

  const modeFromPath =
    !isGameDetail && modeParam !== undefined && modeParam !== ""
      ? modeParam
      : undefined;

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

  useEffect(() => {
    if (modeFromPath !== undefined && isValidExploreView(modeFromPath)) {
      setStoredView(modeFromPath);
    }
  }, [modeFromPath, setStoredView]);

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
      maybeTrackRecommendationChallenge(challenge.metaGame);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelChange = useCallback(
    (sel) => {
      setStoredView(sel);
      navigate(`/explore/${sel}`);
    },
    [navigate, setStoredView]
  );

  if (isGameDetail) {
    if (!gameinfo.has(metaGame)) {
      if (isValidExploreView(metaGame)) {
        return <Navigate to={`/explore/${metaGame}`} replace />;
      }
      return <Navigate to="/explore" replace />;
    }
    if (counts !== null) {
      return (
        <>
          <Helmet>
            <meta
              property="og:title"
              content={`${getGameDisplayName(metaGame)}: Game Information`}
            />
            <meta
              property="og:url"
              content={`https://play.abstractplay.com/games/${metaGame}`}
            />
            <meta
              property="og:description"
              content={`Information on the game ${getGameDisplayName(metaGame)}`}
            />
          </Helmet>
          <MetaItem
            game={gameinfo.get(metaGame)}
            counts={counts[metaGame]}
            toggleStar={toggleStar}
            handleChallenge={handleNewChallenge}
            syncTabToUrl
          />
        </>
      );
    }
    return null;
  }

  if (modeFromPath !== undefined && !isValidExploreView(modeFromPath)) {
    return (
      <Navigate to={`/explore/${DEFAULT_EXPLORE_VIEW}`} replace />
    );
  }

  if (modeFromPath === undefined) {
    const target = isValidExploreView(storedView)
      ? storedView
      : DEFAULT_EXPLORE_VIEW;
    return <Navigate to={`/explore/${target}`} replace />;
  }

  const activeMode = modeFromPath;

  return (
    <>
      <Helmet>
        <meta property="og:title" content="Explore available games" />
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/explore/${activeMode}`}
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
          <p>{t("explore.intro")}</p>
        </div>
        <div className="container">
          <div className="control">
            <div className="select">
              <select
                value={activeMode}
                onChange={(e) => handleSelChange(e.target.value)}
              >
                {EXPLORE_VIEW_ORDER.map((key) => {
                  const cfg = getExploreViewConfig(key);
                  return (
                    <option key={key} value={key}>
                      {t(cfg.titleKey)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
        <hr />
        {EXPLORE_VIEW_ORDER.map((key) => {
          if (activeMode !== key) return null;
          const cfg = getExploreViewConfig(key);
          return (
            <ExploreView
              key={key}
              viewKey={key}
              config={cfg}
              toggleStar={toggleStar}
              counts={counts}
              handleChallenge={key === "all" ? handleNewChallenge : undefined}
            />
          );
        })}
      </article>
    </>
  );
}

export default Explore;
