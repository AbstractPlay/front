import React, { useState, useEffect, Fragment, useMemo } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_ENDPOINT_OPEN } from "../config";
import { callAuthApi } from "../lib/api";
import { maybeTrackRecommendationChallenge } from "../lib/recommendationAttribution";
import { Helmet } from "react-helmet-async";
// import Gallery from "./MetaContainer/Gallery";
import Table from "./MetaContainer/Table";
import MetaItem from "./MetaContainer/MetaItem";
import { listPublicCatalogMetas, getGameDisplayName } from "../lib/gameOptions";
import { useStore } from "../stores";

function MetaContainer(props) {
  const { i18n } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const [counts, countsSetter] = useState(null);
  const [updateCounter, updateCounterSetter] = useState(0);
  const { metaGame } = useParams();

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "meta_games");
        const res = await fetch(url);
        const result = await res.json();
        countsSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, [updateCounter]);

  const games = useMemo(
    () =>
      listPublicCatalogMetas().sort((a, b) =>
        getGameDisplayName(a).localeCompare(getGameDisplayName(b), i18n.language)
      ),
    [i18n.language]
  );
  const toggleStar = async (game) => {
    try {
      const { setGlobalMe } = useStore.getState();
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
        if (newMe !== null && "stars" in newMe && Array.isArray(newMe.stars)) {
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
  };

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

  //   console.log(games);
  if (metaGame === undefined || metaGame === null || !gameinfo.has(metaGame)) {
    return (
      <Fragment>
        <Helmet>
          <meta property="og:title" content="List of available games" />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/games"
          />
          <meta
            property="og:description"
            content="A sortable table of all the games currently available on Abstract Play."
          />
        </Helmet>
        <Table
          metaGame={metaGame}
          counts={counts}
          games={games}
          toggleStar={toggleStar.bind(this)}
          handleChallenge={handleNewChallenge.bind(this)}
          updateSetter={updateCounterSetter}
        />
      </Fragment>
    );
  } else if (counts !== null) {
    return (
      <>
        <Helmet>
          <meta
            property="og:title"
            content={`${getGameDisplayName(metaGame)}: Game Information`}
          />
          <meta
            property="og:url"
            content="https://play.abstractplay.com/games"
          />
          <meta
            property="og:description"
            content={`Information on the game ${getGameDisplayName(metaGame)}`}
          />
        </Helmet>
        <MetaItem
          game={gameinfo.get(metaGame)}
          counts={counts[metaGame]}
          toggleStar={toggleStar.bind(this)}
          handleChallenge={handleNewChallenge.bind(this)}
        />
      </>
    );
  }
}

export default MetaContainer;
