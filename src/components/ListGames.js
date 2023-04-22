import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { gameinfo } from '@abstractplay/gameslib';
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from '../config';
import { Auth } from 'aws-amplify';
import Spinner from './Spinner';

function ListGames(props) {
  const { t } = useTranslation();
  const [games, gamesSetter] = useState(null);
  const [me, meSetter] = useState(null);
  const [update, updateSetter] = useState(0);
  const { gameState, metaGame } = useParams();

  // In case you are logged in get some info, so that we can show your games to you correctly
  useEffect(() => {
    async function fetchData() {
      let token = null;
      try {
        const usr = await Auth.currentAuthenticatedUser();
        token = usr.signInUserSession.idToken.jwtToken;
        console.log("idToken", usr.signInUserSession.idToken);
      }
      catch (error) {
        token = null;
      }
      if (token !== null) {
        try {
          console.log("calling authQuery 'me', with token: " + token);
          const res = await fetch(API_ENDPOINT_AUTH, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            // Don't care about e.g. challenges, so size = small.
            body: JSON.stringify({ "query": "me", "size": "small"}),
          });
          const result = await res.json();
          if (result.statusCode !== 200)
            console.log(JSON.parse(result.body));
          else {
            if (result === null)
              meSetter({});
            else {
              meSetter(JSON.parse(result.body));
              console.log(JSON.parse(result.body));
            }
          }
        }
        catch (error) {
          console.log(error);
        }
      }
    }
    fetchData();
  }, [update, gameState, metaGame]);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${gameState} ${metaGame} games`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'games');
        url.searchParams.append('metaGame', metaGame);
        url.searchParams.append('type', gameState);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        gamesSetter(result);
      }
      catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, [gameState, metaGame]);

  if (update !== props.update) // Can someone PLEASE explain to me why this is needed!!??? (remove it and see what happens...)
    updateSetter(props.update);
  const metaGameName = gameinfo.get(metaGame).name;
  const maxPlayers = games ? games.reduce((max, game) => Math.max(max, game.players.length), 0) : null;
  return (
      <article>
        <h1 className="centered">{gameState === "current" ? t("CurrentGamesList", {"name": metaGameName}) : t("CompletedGamesList", {"name": metaGameName})}</h1>
        <div className="standingChallengesContainer">
          { games === null ? <Spinner/> :
            <table className="standingChallengesTable">
              <tbody>
                <tr>
                  <th>{t("tblHeaderGameNumber")}</th>
                  <th>{gameState === "current" ? t("tblHeaderStarted") : t("tblHeaderFinished")}</th>
                  { [...Array(maxPlayers).keys()].map((i) => <th key={i}>{t("tblHeaderPlayer", {"num": i+1})}</th>) }
                </tr>
                { games.map((game, i) =>
                  <tr key={i}>
                    <td><Link to="/move" state={{"me": me, "settings": me ? me.settings : {}, "game": game, "metaGame": metaGameName }}>{i+1}</Link></td>
                    <td>{ new Date(Number(game.sk.substring(0, game.sk.indexOf('#')))).toLocaleString() }</td>
                    { [...Array(maxPlayers).keys()].map((j) => <td key={j}>{ game.players[j] ? game.players[j].name : null }</td>) }
                  </tr>)
                }
              </tbody>
            </table>
          }
        </div>
      </article>
  );
}

export default ListGames;