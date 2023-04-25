import React, { useState, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { gameinfo } from '@abstractplay/gameslib';
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from '../config';
import { Auth } from 'aws-amplify';
import Spinner from './Spinner';
import NewChallengeModal from './NewChallengeModal';

function Ratings(props) {
  const { t } = useTranslation();
  const [ratings, ratingsSetter] = useState(null);
  const [me, meSetter] = useState(null);
  const [opponent, opponentSetter] = useState(null);
  const [update, updateSetter] = useState(0);
  const [showNewChallengeModal, showNewChallengeModalSetter] = useState(false);
  const { metaGame } = useParams();

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
  },[update]);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${metaGame} ratings`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'ratings');
        url.searchParams.append('metaGame', metaGame);
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
  }, [metaGame]);

  const handleChallenge = (player) => {
    opponentSetter(player);
    showNewChallengeModalSetter(true);
  }

  const handleNewChallengeClose = () => {
    showNewChallengeModalSetter(false);
  }

  const handleNewChallenge2 = async (challenge) => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log('currentAuthenticatedUser', usr);
      await fetch(API_ENDPOINT_AUTH, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
        },
        body: JSON.stringify({
          "query": "new_challenge",
          "pars" : {
            ...challenge,
            "challenger": {"id": me.id, "name": me.name},
          }})
        });
      showNewChallengeModalSetter(false);
    }
    catch (error) {
      console.log(error);
    }
  }

  if (update !== props.update) // Can someone PLEASE explain to me why this is needed!!??? (remove it and see what happens...)
    updateSetter(props.update);
  const metaGameName = gameinfo.get(metaGame).name;
  return (
      <article>
        <h1 className="has-text-centered title">{t("RatingsList", {"name": metaGameName})}</h1>
        <div className="standingChallengesContainer">
          { ratings === null ? <Spinner/> :
            <Fragment>
              <table className="standingChallengesTable">
                <tbody>
                  <tr>
                    <th>{t("tblHeaderRatingRank")}</th>
                    <th>{t("tblHeaderRatedPlayer")}</th>
                    <th>{t("tblHeaderRating")}</th>
                    <th>{t("tblHeaderGamesPlayed")}</th>
                    <th>{t("tblHeaderGamesWon")}</th>
                    <th>{t("tblHeaderGamesDrawn")}</th>
                    <th/>
                  </tr>
                  { ratings.map((rating, i) => {console.log(rating); return (
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td>{rating.name}</td>
                      <td>{Math.round(rating.rating.rating)}</td>
                      <td>{rating.rating.N}</td>
                      <td>{rating.rating.wins}</td>
                      <td>{rating.rating.draws}</td>
                      <td>{me && me.id === rating.id ? "" :
                        <button className="apButton" onClick={() => handleChallenge({id: rating.id, name: rating.name})}>
                          {t("Challenge")}
                        </button>
                      }
                      </td>
                    </tr>) })
                  }
                </tbody>
              </table>
              <NewChallengeModal show={showNewChallengeModal} id={me?.id} opponent={opponent} fixedMetaGame={metaGame} handleClose={handleNewChallengeClose} handleChallenge={handleNewChallenge2} />
            </Fragment>
          }
        </div>
      </article>
  );
}

export default Ratings;