import React, { useState, useEffect, Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { API_ENDPOINT_OPEN } from "../config";
import { Helmet } from "react-helmet-async";
import Spinner from "./Spinner";

function ListGames(props) {
  const { t } = useTranslation();
  const [games, gamesSetter] = useState(null);
  const [update, updateSetter] = useState(0);
  const { gameState, metaGame } = useParams();
  const [canonical, canonicalSetter] = useState("");

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${gameState} ${metaGame} games`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "games");
        url.searchParams.append("metaGame", metaGame);
        url.searchParams.append("type", gameState);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        gamesSetter(result);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
    canonicalSetter(`https://play.abstractplay.com/listgames/${gameState}/${metaGame}/`);
  }, [gameState, metaGame]);

  if (update !== props.update)
    updateSetter(props.update);
  const metaGameName = gameinfo.get(metaGame).name;
  const maxPlayers = games
    ? games.reduce((max, game) => Math.max(max, game.players.length), 0)
    : null;
  return (
    <Fragment>
        <Helmet>
            <link rel="canonical" href={canonical} />
        </Helmet>
    <article>
      <h1 className="has-text-centered title">
        {gameState === "current"
          ? t("CurrentGamesList", { name: metaGameName })
          : t("CompletedGamesList", { name: metaGameName })}
      </h1>
      <div id="TableListContainer">
        {games === null ? (
          <Spinner />
        ) : (
          <table className="table">
            <tbody>
              <tr>
                <th>{t("tblHeaderGameNumber")}</th>
                <th>
                  {gameState === "current"
                    ? t("tblHeaderStarted")
                    : t("tblHeaderFinished")}
                </th>
                { gameState === "current" ? <th>{t("tblHeaderMoves")}</th> : null }
                {[...Array(maxPlayers).keys()].map((i) => (
                  <th key={i}>{t("tblHeaderPlayer", { num: i + 1 })}</th>
                ))}
              </tr>
              {games.map((game, i) => (
                <tr key={i}>
                  <td>
                    <Link to={`/move/${game.metaGame}/${gameState === "current" ? "0" : "1"}/${game.id}`}>
                      {i + 1}
                    </Link>
                  </td>
                  <td>
                    {new Date(
                        Number(gameState === "current" ? game.gameStarted : game.lastMoveTime)
                      ).toLocaleString()}
                  </td>
                  { gameState === "current" ? <td>{game.numMoves}</td> : null }
                  {[...Array(maxPlayers).keys()].map((j) => (
                    <td key={j}>
                      {game.players[j] ? game.players[j].name : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </article>
    </Fragment>
  );
}

export default ListGames;
