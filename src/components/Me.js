import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';
import Spinner from './Spinner';
import GameItem from './GameItem';
import ChallengeItem from './ChallengeItem';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ChallengeView from './ChallengeView';
import ChallengeResponse from './ChallengeResponse';
import NewChallengeModal from './NewChallengeModal.js';
import NewProfile from './NewProfile'
import { API_ENDPOINT_AUTH } from '../config';

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
      if (result.statusCode !== 200)
        errorSetter(JSON.parse(result.body));
      else {
        showChallengeResponseModalSetter(false);
        varsSetter(challenge.id);
      }
    }
    catch (error) {
      errorSetter(error);
    }
  }

  const handleNewChallenge2 = async (challenge) => {
    const game = challenge.metaGame;
    const opponent = challenge.opponent;
    const variants = challenge.variants;

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
            "challenger": {"id": me.id, "name": me.name},
            "metaGame": game,
            "numPlayers": 2,
            "variants": variants,
            "challengees": [opponent]
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
    // const myid = me.id.substring(3);
    // myidSetter(me.id);
    // myidSetter(myid);
    let games = me.games;
    if (games === undefined)
      games = [];
    let myMove = [];
    let waiting = [];
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
        if (game.players[game.toMove].id === me.id)
          myMove.push(game);
        else
          waiting.push(game);
      }
    }
    return (
      <div>
        <h1>{t('WelcomePlayer', {me: me.name})}</h1>
        <h2>{t('Your games')}</h2>
        <h3>{t('Your move')}</h3>
          { myMove
              .map(item => <GameItem me={me.id} settings={me.settings} item={item} key={item.id} canMove={true} stateSetter={props.stateSetter}/>)}
        <h3>{t("Opponent's move")}</h3>
          { waiting
              .map(item => <GameItem me={me.id} settings={me.settings} item={item} key={item.id} canMove={false} stateSetter={props.stateSetter}/>)}
        <h2>{t('Your challenges')}</h2>
        <h3>{t('Response needed')}</h3>
          { me.challengesReceived.map(item =>
            <ChallengeItem me={me.id} item={item} key={item.id} respond={true}
              setters={{
                challengeSetter: challengeSetter,
                showChallengeViewModalSetter: showChallengeViewModalSetter,
                showChallengeResponseModalSetter: showChallengeResponseModalSetter }}/>)}
        <h3>{t('Waiting on response')}</h3>
          { me.challengesIssued.map(item =>
            <ChallengeItem me={me.id} item={item} key={item.id} respond={false}
              setters={{
                challengeSetter: challengeSetter,
                showChallengeViewModalSetter: showChallengeViewModalSetter,
                showChallengeResponseModalSetter: showChallengeResponseModalSetter }}/>)}
        <Button variant="primary" onClick={() => handleNewChallengeClick(myid)}>{t("IssueChallenge")}</Button>

        <NewChallengeModal show={showNewChallengeModal} id={me.id} handleClose={handleNewChallengeClose} handleChallenge={handleNewChallenge2} />

        <Modal show={showChallengeViewModal} onHide={handleChallengeViewClose}>
          <Modal.Header closeButton>
            <Modal.Title>{t('Challenge Details')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{
              <ChallengeView challenge={challenge} me={me}/>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleChallengeRevoke}>
              {t('Revoke challenge')}
            </Button>
            <Button variant="primary" onClick={handleChallengeViewClose}>
              {t('Close')}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showChallengeResponseModal} onHide={handleChallengeResponseClose}>
          <Modal.Header closeButton>
            <Modal.Title>{t('Challenge Details')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{
              <ChallengeResponse challenge={challenge} me={me}/>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => handleChallengeResponse(true)}>
              {t('Accept')}
            </Button>
            <Button variant="primary" onClick={() => handleChallengeResponse(false)}>
            {t('Reject')}
            </Button>
            <Button variant="primary" onClick={handleChallengeResponseClose}>
              {t('Close')}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default Me;
