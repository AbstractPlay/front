import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { gameinfo } from '@abstractplay/gameslib';
import { API_ENDPOINT_OPEN, API_ENDPOINT_AUTH } from '../config';
import { Auth } from 'aws-amplify';
import Spinner from './Spinner';

function StandingChallenges(props) {
  const { state } = useLocation();
  const { t } = useTranslation();
  const [loggedin, loggedinSetter] = useState(false);
  const [myid, myidSetter] = useState(null);
  const [challenges, challengesSetter] = useState(null);
  const [accepted, acceptedSetter] = useState(null);
  const [revoke, revokeSetter] = useState(null);
  const [reject, rejectSetter] = useState(null);
  const [update, updateSetter] = useState(0);

  useEffect(() => {
    async function fetchAuth() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      console.log("idToken", usr.signInUserSession.idToken);
      if (token !== null) {
        loggedinSetter(true);
        myidSetter(usr.signInUserSession.idToken.payload.sub);
      }
    }
    fetchAuth();
  },[]);

  useEffect(() => {
    async function fetchData() {
      console.log(`Fetching ${state.metaGame} standing challenges`);
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'standing_challenges');
        url.searchParams.append('metaGame', state.metaGame);
        const res = await fetch(url);
        const result = await res.json();
        console.log(result);
        challengesSetter(result);
        revokeSetter(null);
        acceptedSetter(null);
      }
      catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, [update]);

  useEffect(() => {
    async function fetchData() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      console.log(`Submitting acceptance of ${state.metaGame} challenge ${accepted}`);
      try {
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            "query": "challenge_response",
            "pars" : {
              "id": accepted,
              "metaGame": state.metaGame,
              "standing": true,
              "response": true
            }
          }),
        });
        const result = await res.json();
        if (result.statusCode !== 200) {
          console.log("handleAccept", result.statusCode);
          console.log(JSON.parse(result.body));
        } else {
          const challenge = challenges.find(c => c.id === accepted);
          if (challenge.numPlayers > 2)
            updateSetter(update + 1);
        }
      }
      catch (error) {
        console.log("handleChallengeResponse catch", error);
        console.log(error);
      }
    }
    if (accepted)
      fetchData();
  }, [accepted]);

  useEffect(() => {
    async function fetchData() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      try {
        console.log("calling challenge_revoke with token: " + token);
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            "query": "challenge_revoke",
            "pars": {
              "id": revoke,
              "metaGame": state.metaGame,
              "standing": true
            }
          }),
        });
        const result = await res.json();
        if (result.statusCode !== 200)
          console.log(JSON.parse(result.body));
        else {
          updateSetter(update + 1);
        }
      }
      catch (error) {
        console.log(error);
      }
    }
    if (revoke) {
      fetchData();
    }
  }, [revoke]);

  useEffect(() => {
    async function fetchData() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      console.log(`Submitting reject of ${state.metaGame} challenge ${reject}`);
      try {
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            "query": "challenge_response",
            "pars" : {
              "id": reject,
              "metaGame": state.metaGame,
              "standing": true,
              "response": false
            }
          }),
        });
        const result = await res.json();
        if (result.statusCode !== 200) {
          console.log("Reject useEffect", result.statusCode);
          console.log(JSON.parse(result.body));
        } else {
          updateSetter(update + 1);
        }
      }
      catch (error) {
        console.log("useEffect Reject catch", error);
      }
    }
    if (reject) {
      fetchData();
      rejectSetter(null);
    }
  }, [reject]);

  const handleAccept = async (id) => {
    acceptedSetter(id);
  }

  const handleReject = async (id) => {
    rejectSetter(id);
  }

  const handleRevoke = async (id) => {
    revokeSetter(id);
  }

  const metaGame = state.metaGame;
  const metaGameName = gameinfo.get(metaGame).name;
  console.log(metaGame);
  const showRespond = loggedin && challenges;
  const showAccepters = challenges && challenges.find(c => c.players.length > 1);
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
        <h1 className="centered">{t("StandingChallenges", {"name": metaGameName})}</h1>
        <div className="standingChallengesContainer">
          { challenges === null ? <Spinner/> :
            <table className="standingChallengesTable">
              <tbody>
                <tr>
                  <th>{t("tblHeaderChallenger")}</th>
                  <th>{t("tblHeaderPlayers")}</th>
                  { showAccepters ? <th>{t("tblHeaderAccepted")}</th> : null }
                  <th>{t("tblHeaderSeating")}</th>
                  <th>{t("tblHeaderVariants")}</th>
                  <th>{t("tblHeaderHardClock")}</th>
                  <th>{t("tblHeaderClockStart")}</th>
                  <th>{t("tblHeaderClockIncrement")}</th>
                  <th>{t("tblHeaderClockMax")}</th>
                  <th>{t("tblHeaderRated")}</th>
                  { showRespond ? <th>{t("tblHeaderRespond")}</th> : null }
                </tr>
                { challenges.map((challenge, index) =>
                  <tr key={index}>
                    <td>{challenge.challenger.name}</td>
                    <td>{challenge.numPlayers}</td>
                    { !showAccepters ? null :
                      <td>{challenge.players.filter(p => p.id !== challenge.challenger.id).map(p => p.name).join(', ')}</td>
                    }
                    <td>{challenge.seating === "random" ? t("Random") : challenge.seating === "s1" ? t("ChallengerFirst") : t("ChallengerSecond")}</td>
                    <td>{challenge.variants !== undefined && challenge.variants.length > 0 ? challenge.variants.join(', ') : ''}</td>
                    <td>{challenge.clockHard ? t("Yes") : t("No")}</td>
                    <td>{challenge.clockStart}</td>
                    <td>{challenge.clockInc}</td>
                    <td>{challenge.clockMax}</td>
                    <td>{challenge.rated ? t("Yes") : t("No")}</td>
                    { !showRespond ? null :
                      <td>
                        {
                          challenge.id === accepted ? t("Accepted") : challenge.id === reject || challenge.id === revoke ? <Spinner></Spinner> :
                            challenge.challenger.id === myid ?
                              <button onClick={() => handleRevoke(challenge.id)}>
                                {t("Revoke")}
                              </button>
                            :
                              challenge.players.find(p => p.id === myid) ?
                                <button onClick={() => handleReject(challenge.id)}>
                                  {t("Revoke")}
                                </button>
                              :
                                <button onClick={() => handleAccept(challenge.id)}>
                                  {t("Accept")}
                                </button>
                        }
                      </td>
                    }
                  </tr>)
                }
              </tbody>
            </table>        
          }
        </div>
      </article>
    </div>
  );
}

export default StandingChallenges;