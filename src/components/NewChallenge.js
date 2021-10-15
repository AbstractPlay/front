import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from './Spinner';

function NewChallenge(props) {
  const { t } = useTranslation();
  const setters = props.setters;
  const myid = props.id;
  const [games, gamesSetter] = useState(null);
  const [users, usersSetter] = useState(null);
  const [error, errorSetter] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL('https://m3y2udc717.execute-api.us-east-1.amazonaws.com/dev/query');
        url.searchParams.append('query', 'game_names');
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        gamesSetter(result);
      }
      catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  },[]);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL('https://m3y2udc717.execute-api.us-east-1.amazonaws.com/dev/query');
        url.searchParams.append('query', 'user_names');
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        usersSetter(result);
      }
      catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  },[]);

  if (error)
    return <div><p>{t('Error')}</p><p>{error.message}</p></div>;
  else
    return (
      <div>
        <label>{t("ChooseGame")}</label>
        { games === null ? <Spinner/> :
            <select name="games" id="game_for_challenge" onChange={(e) => setters.challengeGameSetter(e.target.value)}>
              <option value="">--{t('Select')}--</option>
              { games.map(item => { return <option key={item.name} value={item.name}>{item.name}</option>}) }
            </select>
        }
        <label>{t("ChooseOpponent")}</label>
        { users === null ? <Spinner/> :
            <select name="users" id="user_for_challenge" onChange={(e) =>
              setters.challengePlayerSetter({id: e.target.value, name: e.target.options[e.target.selectedIndex].text})}>
            <option value="">--{t('Select')}--</option>
            { users
              .filter(user => user.id !== myid)
              .map(item => { return <option key={item.id} value={item.id}>{item.name}</option>})}
          </select>
        }
      </div>
    );
}

export default NewChallenge;
