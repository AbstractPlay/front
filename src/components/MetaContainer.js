import React, { useState, useEffect, useContext, useRef, createRef, Fragment } from "react";
import MetaItem from "./MetaItem";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { MeContext } from "../pages/Skeleton";
import { API_ENDPOINT_OPEN } from "../config";
import { Helmet } from "react-helmet-async";

function MetaContainer(props) {
  const [theMetaGame, theMetaGameSetter] = useState("");
  const [counts, countsSetter] = useState(null);
  const [globalMe,] = useContext(MeContext);
  const gameDivs = useRef({});
  const [hideDetails, hideDetailsSetter] = useState(false);
  const [filterStars, filterStarsSetter] = useState(false);
  const { metaGame } = useParams();
  const { t, i18n } = useTranslation();
  const [ canonical, canonicalSetter ] = useState("https://play.abstractplay.com/games/");
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
        console.log(result);
        countsSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (metaGame !== undefined) {
      handleChangeGame(metaGame);
      canonicalSetter(`https://play.abstractplay.com/games/${metaGame}/`)
    }
  }, [metaGame]);

  const handleChangeGame = (game) => {
    console.log(gameDivs.current);
    theMetaGameSetter(game);
    gameDivs.current[game].current.scrollIntoView({ behavior: "smooth" });
    console.log(game);
  };

  let games = [...gameinfo.keys()].sort((a, b) => {
    const na = gameinfo.get(a).name;
    const nb = gameinfo.get(b).name;
    if (na < nb) return -1;
    else if (na > nb) return 1;
    return 0;
  });
  if (process.env.REACT_APP_REAL_MODE === "production") {
    games = games.filter(id => ! gameinfo.get(id).flags.includes("experimental"));
  }
  if ( (filterStars) && (globalMe !== null) && ("stars" in globalMe) && (globalMe.stars.length > 0) ) {
    games = games.filter(id => globalMe.stars.includes(id));
  }

  console.log(games);
  return (
    <Fragment>
        <Helmet>
          <link rel="canonical" href={canonical} />
        </Helmet>

    <article>
      <div className="container has-text-centered">
        <h1 className="title">{t("AvailableGames")}</h1>
        <div className="field">
          <div className="control">
            <div className="select">
              <select
                name="games"
                id="game_for_challenge"
                onChange={(e) => handleChangeGame(e.target.value)}
                defaultValue={metaGame !== undefined ? metaGame : null}
              >
                <option value="">--{t("SelectGameDropdown")}--</option>
                {games.map((game) => {
                  return (
                    <option key={gameinfo.get(game).uid} value={game}>
                      {gameinfo.get(game).name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
        <div className="field">
          <div className="control">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={hideDetails}
                onChange={() => hideDetailsSetter(!hideDetails)}
              />
              {t("HideDetails")}
            </label>&nbsp;&nbsp;&nbsp;
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filterStars}
                onChange={() => filterStarsSetter(!filterStars)}
              />
              {t("FilterStars")}
            </label>
          </div>
        </div>
      </div>
      <div className="columns is-multiline">
        {games.map((k) => (
          <MetaItem
            ref={(el) => {
              gameDivs.current[k] = createRef();
              gameDivs.current[k].current = el;
            }}
            key={gameinfo.get(k).uid}
            game={gameinfo.get(k)}
            counts={counts ? counts[gameinfo.get(k).uid] : undefined}
            highlight={k === theMetaGame}
            hideDetails={hideDetails}
          />
        ))}
      </div>
    </article>
    </Fragment>
  );
}

export default MetaContainer;
