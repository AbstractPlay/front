import React, { useState, useEffect, useContext, useRef, createRef } from "react";
import MetaItem from "./MetaItem";
import { gameinfo } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";
import { MeContext } from "../../pages/Skeleton";

// props:
//   - metaGame
//   - counts
//   - games
function Gallery(props) {
  const [theMetaGame, theMetaGameSetter] = useState(props.metaGame);
  const counts = props.counts;
  const [globalMe,] = useContext(MeContext);
  const gameDivs = useRef({});
  const [hideDetails, hideDetailsSetter] = useState(false);
  const [filterStars, filterStarsSetter] = useState(false);
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (theMetaGame !== undefined) {
      handleChangeGame(theMetaGame);
    }
  }, [theMetaGame]);

  const handleChangeGame = (game) => {
    console.log(gameDivs.current);
    theMetaGameSetter(game);
    gameDivs.current[game].current.scrollIntoView({ behavior: "smooth" });
    console.log(game);
  };

  let games = props.games;
  if ( (filterStars) && (globalMe !== null) && ("stars" in globalMe) && (globalMe.stars.length > 0) ) {
    games = games.filter(id => globalMe.stars.includes(id));
  }

  console.log(games);
  return (
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
                defaultValue={theMetaGame !== undefined ? theMetaGame : null}
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
            toggleStar={props.toggleStar}
          />
        ))}
      </div>
    </article>
  );
}

export default Gallery;
