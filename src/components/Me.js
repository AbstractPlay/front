import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';
import Spinner from './Spinner';
import GameItem from './GameItem';
import Modal from './Modal';
import ChallengeItem from './ChallengeItem';
import ChallengeView from './ChallengeView';
import ChallengeResponse from './ChallengeResponse';
import NewChallengeModal from './NewChallengeModal';
import NewProfile from './NewProfile'
import { API_ENDPOINT_AUTH } from '../config';
import { Link } from "react-router-dom";

function Me(props) {
  const [myid, myidSetter] = useState(-1);
  const [me, meSetter] = useState();
  const [error, errorSetter] = useState(null);
  const [challenge, challengeSetter] = useState(0);
  const [vars, varsSetter] = useState({});
  const [showChallengeViewModal, showChallengeViewModalSetter] = useState(false);
  const [showChallengeResponseModal, showChallengeResponseModalSetter] = useState(false);
  const [showNewChallengeModal, showNewChallengeModalSetter] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      // Can't use props.token because it might have expired by the time the user gets here.
      // Auth.currentAuthenticatedUser() will automatically renew the token if its expired.
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      try {
        console.log("calling authQuery with token: " + token);
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ "query": "me"}),
        });
        const result = await res.json();
        if (result.statusCode !== 200)
          errorSetter(JSON.parse(result.body));
        else {
          console.log(result);
          if (result === null)
            meSetter({});
          else
            meSetter(JSON.parse(result.body));
        }
      }
      catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  },[vars]);

  const handleNewChallengeClick = (id) => {
    showNewChallengeModalSetter(true);
    myidSetter(id);
  }

  const handleNewChallengeClose = () => {
    showNewChallengeModalSetter(false);
  }

  const handleChallengeViewClose = () => {
    showChallengeViewModalSetter(false);
  }

  const handleChallengeRevoke = async () => {
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
      console.log("calling authQuery query = challenge_revoke with token: " + token);
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
            "id": challenge.id
          }
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200)
        errorSetter(JSON.parse(result.body));
      else {
        showChallengeViewModalSetter(false);
        varsSetter(challenge.id);
      }
    }
    catch (error) {
      errorSetter(error);
    }
  }

  const handleChallengeResponseClose = () => {
    showChallengeResponseModalSetter(false);
  }

  const handleChallengeResponse = async (resp) => {
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
      console.log("calling authQuery query = challenge_response with token: " + token);
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
            "id": challenge.id,
            "response": resp
          }
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200) {
        console.log("handleChallengeResponse", result.statusCode);
        errorSetter(JSON.parse(result.body));
      } else {
        showChallengeResponseModalSetter(false);
        varsSetter(challenge.id);
      }
    }
    catch (error) {
      console.log("handleChallengeResponse catch", error);
      errorSetter(error);
    }
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
      varsSetter({ dummy: myid });
    }
    catch (error) {
      errorSetter(error);
    }
  }

  if (error) {
    return <div><p>{t('Error')}</p><p>{error.message}</p></div>;
  }
  if (!me) {
    return <Spinner />;
  }
  if (me.name === undefined) {
    return <NewProfile show={true} varsSetter={varsSetter} />;
  }
  else {
    let games = me.games;
    if (games === undefined)
      games = [];
    let myMove = [];
    let waiting = [];
    let over = [];
    for (const game of games) {
      if (Array.isArray(game.toMove)) {
        let found = false;
        for (let i = 0; i < game.players.length; i++) {
          if (game.players[i].id === me.id) {
            if (game.toMove[i]) {
              myMove.push(game);
              found = true;
            }
          }
        }
        if (!found)
          waiting.push(game);
      }
      else {
        console.log("game", game);
        if (game.toMove === "" || game.toMove === null)
          over.push(game);
        else if (game.players[game.toMove].id === me.id)
          myMove.push(game);
        else
          waiting.push(game);
      }
    }
    let challengesResponded = me.challengesIssued.concat(me.challengesAccepted);
    return (
      <div className="main">
        <nav>
          <div><Link to="/about">{t('About')}</Link></div>
          <div><Link to="/games">{t('Games')}</Link></div>
        </nav>
        <article>
          <div className="article">
            <div className="dashboardContainer1">
              <div className="dashboardContainer2">
                <h1 className="centered">{t('WelcomePlayer', {me: me.name})}</h1>
                <div className="groupLevel1">
                  <div className="groupLevel1Header"><span>{t('YourGames')}</span></div>
                  <div className="groupLevel2">
                    <div className="groupLevel2Header"><span>{t('YourMove')}</span></div>
                    { myMove.length === 0
                      ? <span className="listComment">{t('NoYourMove')}</span>
                      : <ul> {myMove.map(item => <GameItem me={me.id} settings={me.settings} item={item} key={item.id} canMove={true} stateSetter={props.stateSetter}/>)} </ul> 
                    }
                  </div>
                  <div className="groupLevel2">
                    <div className="groupLevel2Header"><span>{t('OpponentMove')}</span></div>
                    { waiting.length === 0
                        ? <span className="listComment">{t('NoOpponentMove')}</span>
                        : <ul> {waiting.map(item => <GameItem me={me.id} settings={me.settings} item={item} key={item.id} canMove={false} stateSetter={props.stateSetter}/>)} </ul>
                    }
                  </div>
                  { over.length === 0 ? '' :
                    <div className="groupLevel2">
                      <div className="groupLevel2Header"><span>{t('CompletedGames')}</span></div>
                      <ul> {over.map(item => <GameItem me={me.id} settings={me.settings} item={item} key={item.id} canMove={false} stateSetter={props.stateSetter}/>)}</ul>
                    </div>
                  }
                </div>
                <div className="groupLevel1">
                  <div className="groupLevel1Header"><span>{t('YourChallenges')}</span></div>
                  <div className="groupLevel2">
                    <div className="groupLevel2Header"><span>{t('ChallengeResponse')}</span></div>
                    { me.challengesReceived.length === 0
                      ? <span className="listComment">{t('NoChallengeResponse')}</span>
                      : <ul>
                          { me.challengesReceived.map(item =>
                          <ChallengeItem me={me.id} item={item} key={item.id} respond={true}
                            setters={{
                              challengeSetter: challengeSetter,
                              showChallengeViewModalSetter: showChallengeViewModalSetter,
                              showChallengeResponseModalSetter: showChallengeResponseModalSetter }}/>)
                          }
                        </ul>
                    }
                  </div>
                  <div className="groupLevel2">
                    <div className="groupLevel2Header"><span>{t('WaitingResponse')}</span></div>
                    { challengesResponded.length === 0
                      ? <span className="listComment">{t('NoWaitingResponse')}</span>
                      : <ul>
                          { challengesResponded.map(item =>
                          <ChallengeItem me={me.id} item={item} key={item.id} respond={false}
                            setters={{
                              challengeSetter: challengeSetter,
                              showChallengeViewModalSetter: showChallengeViewModalSetter,
                              showChallengeResponseModalSetter: showChallengeResponseModalSetter }}/>) 
                          }
                        </ul>
                    }
                  </div>
                  <div className="groupLevel2">
                    <div className="groupLevel2Header"><span>{t('NewChallenge')}</span></div>
                    <span className="listComment"><button className="apButton" onClick={() => handleNewChallengeClick(myid)}>{t("IssueChallenge")}</button></span>                
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
        <NewChallengeModal show={showNewChallengeModal} id={me.id} handleClose={handleNewChallengeClose} handleChallenge={handleNewChallenge2} />

        <Modal show={showChallengeViewModal} title={t('Challenge Details')} 
          buttons={[{label: (challenge.challenger ? challenge.challenger.id : '') === me.id ? t('RevokeChallenge') : t('RevokeAcceptance'), action: handleChallengeRevoke}, {label: t('Close'), action: handleChallengeViewClose}]}>
          <div>{
              <ChallengeView challenge={challenge} me={me.id}/>
            }
          </div>
        </Modal>

        <Modal show={showChallengeResponseModal} title={t('Challenge Details')}
          buttons={[{label: t('Accept'), action: () => handleChallengeResponse(true)}, {label: t('Reject'), action: () => handleChallengeResponse(false)}, {label: t('Close'), action: handleChallengeResponseClose}]}>
          <ChallengeResponse challenge={challenge} me={me}/>
        </Modal>
      </div>
    );
  }
}

export default Me;
