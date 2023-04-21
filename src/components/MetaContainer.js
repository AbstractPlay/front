import React, { useState, useEffect, useRef, createRef } from 'react';
import MetaItem from './MetaItem';
import { gameinfo } from '@abstractplay/gameslib';
import { useTranslation } from 'react-i18next';
import { addResource } from '@abstractplay/gameslib';
import { API_ENDPOINT_OPEN } from '../config';
import { Auth } from 'aws-amplify';

function MetaContainer(props) {
  const [loggedin, loggedinSetter] = useState(false);
  const [theMataGame, theMetaGameSetter] = useState("");
  const [counts, countsSetter] = useState(null);
  const gameDivs = useRef({});
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  useEffect(() => {
    async function fetchAuth() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const token = usr.signInUserSession.idToken.jwtToken;
        if (token !== null)
          loggedinSetter(true);
      }
      catch (error) {
        loggedinSetter(false);
      }
    }
    fetchAuth();
  },[]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'meta_games');
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        countsSetter(result);
      }
      catch (error) {
        console.log(error);
      }
    }
    fetchData();
  },[]);

  const handleChangeGame = (game) => {
    console.log(gameDivs.current);
    theMetaGameSetter(game);
    gameDivs.current[game].current.scrollIntoView({behavior: 'smooth'});
    console.log(game);
  }

  const games = [...gameinfo.keys()].sort((a, b) => {
    const na = gameinfo.get(a).name;
    const nb = gameinfo.get(b).name;
    if (na < nb)
      return -1;
    else if (na > nb)
      return 1;
    return 0;
  })

  console.log(games);
  return (
      <article>
        <h1 className="centered">{t("AvailableGames")}</h1>
        <div className="goToGame centered">
          <span className="goToGameLabel">Go to: </span>
          <select name="games" id="game_for_challenge" onChange={(e) => handleChangeGame(e.target.value)}>
            <option value="">--{t('Select')}--</option>
            { games.map(game => { return <option key={gameinfo.get(game).uid} value={game}>{gameinfo.get(game).name}</option>}) }
          </select>
        </div>
        <div className="metaGames">
          {games.map(k =>
            <MetaItem ref={el => {gameDivs.current[k] = createRef(); gameDivs.current[k].current = el}} key={gameinfo.get(k).uid} game={gameinfo.get(k)}
              counts={counts ? counts[gameinfo.get(k).uid] : undefined} highlight = {k === theMataGame}/>)
          }
        </div>
      </article>
  );
}

export default MetaContainer;
