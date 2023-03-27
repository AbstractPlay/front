import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { gameinfo } from '@abstractplay/gameslib';
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from '../config';
import { Auth } from 'aws-amplify';
import Spinner from './Spinner';

function Ratings(props) {
  const { state } = useLocation();
  const { t } = useTranslation();
  const [loggedin, loggedinSetter] = useState(false);
  const [ratings, ratingsSetter] = useState(null);
  const [me, meSetter] = useState(null);
  const [update, updateSetter] = useState(0);

  // In case you are logged in get some info, so that we can show your games to you correctly
  useEffect(() => {
    async function fetchData() {
      let token = null;
      try {
        const usr = await Auth.currentAuthenticatedUser();
        token = usr.signInUserSession.idToken.jwtToken;
        console.log("idToken", usr.signInUserSession.idToken);
        if (token !== null) {
          loggedinSetter(true);
        }
      }
      catch (error) {
        loggedinSetter(false);
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
  },[update]);

  useEffect(() => {
    async function fetchAuth() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const token = usr.signInUserSession.idToken.jwtToken;
        console.log("idToken", usr.signInUserSession.idToken);
        if (token !== null) {
          loggedinSetter(true);
        }
      }
      catch (error) {
        loggedinSetter(false);
      }
    }
    fetchAuth();
  },[]);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${state.type} ${state.metaGame} ratings`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'ratings');
        url.searchParams.append('metaGame', state.metaGame);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        result.sort((a, b) => b.rating.rating - a.rating.rating);
        ratingsSetter(result);
      }
      catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, []);

  if (update !== props.update) // Can someone PLEASE explain to me why this is needed!!??? (remove it and see what happens...)
    updateSetter(props.update);
  const metaGame = state.metaGame;
  const metaGameName = gameinfo.get(metaGame).name;
  return (
    <div className="main">
      <nav>
        <div>
          <Link to="/about">{t('About')}</Link>
        </div>
        <div><Link to="/games">{t('Games')}</Link></div>
        { loggedin ?
          <div><Link to="/">{t('MyDashboard')}</Link></div>
          : ""
        }
      </nav>
      <article>
        <h1 className="centered">{t("RatingsList", {"name": metaGameName})}</h1>
        <div className="standingChallengesContainer">
          { ratings === null ? <Spinner/> :
            <table className="standingChallengesTable">
              <tbody>
                <tr>
                  <th>{t("tblHeaderRatingRank")}</th>
                  <th>{t("tblHeaderRatedPlayer")}</th>
                  <th>{t("tblHeaderRating")}</th>
                  <th>{t("tblHeaderGamesPlayed")}</th>
                  <th>{t("tblHeaderGamesWon")}</th>
                  <th>{t("tblHeaderGamesDrawn")}</th>
                </tr>
                { ratings.map((rating, i) => {console.log(rating); return (
                  <tr key={i}>
                    <td>{i+1}</td>
                    <td>{rating.name}</td>
                    <td>{Math.round(rating.rating.rating)}</td>
                    <td>{rating.rating.N}</td>
                    <td>{rating.rating.wins}</td>
                    <td>{rating.rating.draws}</td>
                  </tr>) })
                }
              </tbody>
            </table>
          }
        </div>
      </article>
    </div>
  );
}

export default Ratings;