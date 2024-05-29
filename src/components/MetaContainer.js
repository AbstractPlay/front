import React, { useState, useEffect, Fragment, useContext } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { MeContext } from "../pages/Skeleton";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { Helmet } from "react-helmet-async";
// import Gallery from "./MetaContainer/Gallery";
import Table from "./MetaContainer/Table";
import MetaItem from "./MetaContainer/MetaItem";

function MetaContainer(props) {
  const [globalMe, globalMeSetter] = useContext(MeContext);
  const [counts, countsSetter] = useState(null);
  const [users, usersSetter] = useState(null);
  const [summary, summarySetter] = useState(null);
  const [updateCounter, updateCounterSetter] = useState(0);
  const { metaGame } = useParams();
  const { i18n } = useTranslation();
  addResource(i18n.language);

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
        console.log(error);
      }
    }
    fetchData();
  }, [updateCounter]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "user_names");
        const res = await fetch(url);
        const result = await res.json();
        usersSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL("https://records.abstractplay.com/_summary.json");
        const res = await fetch(url);
        const result = await res.json();
        summarySetter(result);
      } catch (error) {
        console.log(error);
        summarySetter(null);
      }
    }
    fetchData();
  }, []);

  let games = [...gameinfo.keys()].sort((a, b) => {
    const na = gameinfo.get(a).name;
    const nb = gameinfo.get(b).name;
    if (na < nb) return -1;
    else if (na > nb) return 1;
    return 0;
  });
  if (process.env.REACT_APP_REAL_MODE === "production") {
    games = games.filter(
      (id) => !gameinfo.get(id).flags.includes("experimental")
    );
  }

  const toggleStar = async (game) => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "toggle_star",
          pars: {
            metaGame: game,
          },
        }),
      });
      if (res.status !== 200) {
        const result = await res.json();
        console.log(
          `An error occurred while saving toggling a star:\n${result}`
        );
      } else {
        const result = await res.json();
        const newMe = JSON.parse(JSON.stringify(globalMe));
        newMe.stars = JSON.parse(result.body);
        globalMeSetter(newMe);
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
  };

  const handleNewChallenge = async (challenge) => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("currentAuthenticatedUser", usr);
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "new_challenge",
          pars: {
            ...challenge,
            challenger: { id: globalMe.id, name: globalMe.name },
          },
        }),
      });
    } catch (error) {
      console.log(error);
    }
  };

//   console.log(games);
  if (metaGame === undefined  || metaGame === null || ! gameinfo.has(metaGame)) {
    return (
        <Fragment>
          <Helmet>
            <meta property="og:title" content="List of available games" />
            <meta property="og:url" content="https://play.abstractplay.com/games" />
            <meta property="og:description" content="A sortable table of all the games currently available on Abstract Play." />
          </Helmet>
          <Table
            metaGame={metaGame}
            counts={counts}
            games={games}
            summary={summary}
            toggleStar={toggleStar.bind(this)}
            handleChallenge={handleNewChallenge.bind(this)}
            users={users}
            updateSetter={updateCounterSetter}
          />
        </Fragment>
      );
  } else if (counts !== null) {
    return (
        <>
          <Helmet>
            <meta property="og:title" content={`${gameinfo.get(metaGame).name}: Game Information`} />
            <meta property="og:url" content="https://play.abstractplay.com/games" />
            <meta property="og:description" content={`Information on the game ${gameinfo.get(metaGame).name}`} />
          </Helmet>
          <MetaItem
            game={gameinfo.get(metaGame)}
            counts={counts[metaGame]}
            summary={summary}
            toggleStar={toggleStar.bind(this)}
            handleChallenge={handleNewChallenge.bind(this)}
          />
        </>
    );
  }

}

export default MetaContainer;
