import React, { useState, useEffect, Fragment } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { useParams, useNavigate } from "react-router-dom";
import { API_ENDPOINT_OPEN } from "../config";
import { callAuthApi } from "../lib/api";
import { maybeTrackRecommendationChallenge } from "../lib/recommendationAttribution";
import { Helmet } from "react-helmet-async";
// import Gallery from "./MetaContainer/Gallery";
import Table from "./MetaContainer/Table";
import MetaItem from "./MetaContainer/MetaItem";
import { listPublicCatalogMetas, getGameDisplayName } from "../lib/gameOptions";
import { useStore } from "../stores";
import {
  soloPlayNavigatePath,
  startSoloGameRequest,
} from "../lib/soloPlay";

function MetaContainer(props) {
  const globalMe = useStore((state) => state.globalMe);
  const navigate = useNavigate();
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

  let games = listPublicCatalogMetas().sort((a, b) => {
    const na = getGameDisplayName(a);
    const nb = getGameDisplayName(b);
    if (na < nb) return -1;
    else if (na > nb) return 1;
    return 0;
  });
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

  const handleStartSolo = async (pars) => {
    try {
      const body = await startSoloGameRequest(pars);
      navigate(soloPlayNavigatePath(body, pars.metaGame));
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
          handleStartSolo={handleStartSolo.bind(this)}
        />
      </>
    );
  }
}

export default MetaContainer;
