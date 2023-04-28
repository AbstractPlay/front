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
import i18n from '../i18n';
import { Fragment } from 'react';

function Me(props) {
  const [myid, myidSetter] = useState(-1);
  const [me, meSetter] = useState();
  const [error, errorSetter] = useState(null);
  const [challenge, challengeSetter] = useState(0);
  const [vars, varsSetter] = useState({});
  const [update, updateSetter] = useState(0);
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
        console.log("calling authQuery 'me', with token: " + token);
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
          if (result === null)
            meSetter({});
          else {
            meSetter(JSON.parse(result.body));
            console.log(JSON.parse(result.body));
          }
        }
      }
      catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  },[vars, update]);

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
    if (me.id !== challenge.challenger.id)
      return handleChallengeResponse(false);
    try {
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
            "id": challenge.id,
            "standing": challenge.standing === true,
            "metaGame": challenge.metaGame
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
            "standing": challenge.standing === true,
            "metaGame": challenge.metaGame,
            "response": resp
          }
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200) {
        console.log("handleChallengeResponse", result.statusCode);
        errorSetter(JSON.parse(result.body));
      } else {
        showChallengeViewModalSetter(false);
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

  const handleUpdateMetaGameCountsClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      await fetch(API_ENDPOINT_AUTH, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
        },
        body: JSON.stringify({
          "query": "update_meta_game_counts",
          "pars" : {
          }})
        });
    }
    catch (error) {
      errorSetter(error);
    }
  }

  const handleUpdateMetaGameRatingsClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      await fetch(API_ENDPOINT_AUTH, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
        },
        body: JSON.stringify({
          "query": "update_meta_game_ratings",
          "pars" : {
          }})
        });
    }
    catch (error) {
      errorSetter(error);
    }
  }

  const handleTestAsyncClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("Posting test_async");
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
        },
        body: JSON.stringify({
          "query": "test_async",
          "pars" : {
            "N": 1600000000
          }})
        });
      const result = await res.json();
      console.log("test_async returned:");
      console.log(JSON.parse(result.body));
    }
    catch (error) {
      errorSetter(error);
    }
  }

  const handleOneTimeFixClick = async () => {
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("Posting onetime_fix");
      await fetch(API_ENDPOINT_AUTH, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usr.signInUserSession.idToken.jwtToken}`
        },
        body: JSON.stringify({
          "query": "onetime_fix"
        })
      });
    }
    catch (error) {
      errorSetter(error);
    }
  }

  if (error) {
    return <div><p>{t('Error')}</p><p>{error.message}</p></div>;
  }
  if (!me) {
    return (
        <article>
              <Spinner />
        </article>
    );
  }
  if (me.name === undefined) {
    return <NewProfile show={true} varsSetter={varsSetter} />;
  }
  else {
    if (update !== props.update) // Can someone PLEASE explain to me why this is needed!!??? (remove it and see what happens...)
      updateSetter(props.update);
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
    var lng = "en";
    if (me.language !== undefined)
      lng = me.language;
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
      console.log(`changed language  to ${lng}`);
    }
    let challengesResponded = me.challengesIssued.concat(me.challengesAccepted);
    console.log("challengesIssued", me.challengesIssued);
    console.log("challengesAccepted", me.challengesAccepted)
    console.log("standingChallenges", me.standingChallenges);
    console.log("challengesReceived", me.challengesReceived);
    return (
        <article id="dashboard">
            <h1 className="title has-text-centered">{t('WelcomePlayer', {me: me.name})}</h1>
            {/* Your Games */}
            <div className="columns">
                <div className="column content is-half is-offset-one-quarter">
                    <p className="subtitle lined"><span>{t('YourGames')}</span></p>
                    <div className="indentedContainer">
                        <p className="lined"><span>{t('YourMove')}</span></p>
                        <div className="indentedContainer">
                            { myMove.length === 0
                                ? <p>{t('NoYourMove')}</p>
                                : <ul> {myMove.map(item => <GameItem me={me} settings={me.settings} item={item} key={item.id} canMove={true} stateSetter={props.stateSetter}/>)} </ul>
                            }
                        </div>
                        <p className="lined"><span>{t('OpponentMove')}</span></p>
                        <div className="indentedContainer">
                            { waiting.length === 0
                                ? <p>{t('NoOpponentMove')}</p>
                                : <ul> {waiting.map(item => <GameItem me={me} settings={me.settings} item={item} key={item.id} canMove={false} stateSetter={props.stateSetter}/>)} </ul>
                            }
                        </div>
                        { over.length === 0 ? '' :
                            <Fragment>
                            <p className="lined"><span>{t('CompletedGames')}</span></p>
                            <div className="indentedContainer">
                                <ul> {over.map(item => <GameItem me={me} settings={me.settings} item={item} key={item.id} canMove={false} stateSetter={props.stateSetter}/>)}</ul>
                            </div>
                            </Fragment>
                        }
                    </div>
                </div>
            </div>
            {/* Your Challenges */}
            <div className="columns">
                <div className="column content is-half is-offset-one-quarter">
                    <p className="subtitle lined"><span>{t('YourChallenges')}</span></p>
                    <div className="indentedContainer">
                        <p className="lined"><span>{t('ChallengeResponse')}</span></p>
                        <div className="indentedContainer">
                            { me.challengesReceived.length === 0
                            ? <p>{t('NoChallengeResponse')}</p>
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
                        <p className="lined"><span>{t('WaitingResponse')}</span></p>
                        <div className="indentedContainer">
                            { challengesResponded.length === 0
                            ? <p>{t('NoWaitingResponse')}</p>
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
                        <p className="lined"><span>{t('StandingChallenges2')}</span></p>
                        <div className="indentedContainer">
                            { me.standingChallenges.length === 0
                            ? <p>{t('NoStandingChallenges')}</p>
                            : <ul>
                                { me.standingChallenges.map(item =>
                                <ChallengeItem me={me.id} item={item} key={item.id} respond={false}
                                    setters={{
                                    challengeSetter: challengeSetter,
                                    showChallengeViewModalSetter: showChallengeViewModalSetter,
                                    showChallengeResponseModalSetter: showChallengeResponseModalSetter }}/>)
                                }
                                </ul>
                            }
                        </div>
                    <Fragment>
                        <p className="lined"><span>{t('NewChallenge')}</span></p>
                        <button className="button is-small apButton" onClick={() => handleNewChallengeClick(myid)}>{t("IssueChallenge")}</button>
                    </Fragment>
                    </div>
                </div>
                {/* Admin functionality */}
                { me.admin !== true ? '' :
                  <div className="columns">
                    <div className="column content is-half is-offset-one-quarter">
                        <p className="lined"><span>Administration</span></p>
                        <button className="button is-small apButton" onClick={() => handleUpdateMetaGameCountsClick()}>Update meta game counts</button>
                        <button className="button is-small apButton" onClick={() => handleUpdateMetaGameRatingsClick()}>Update meta game ratings</button>
                        <button className="button is-small apButton" onClick={() => handleOneTimeFixClick()}>One time fix</button>
                        <button className="button is-small apButton" onClick={() => handleTestAsyncClick()}>Test async</button>

                    </div>
                  </div>
                }
            </div>
            <NewChallengeModal show={showNewChallengeModal} id={me.id} handleClose={handleNewChallengeClose} handleChallenge={handleNewChallenge2} />

            <Modal
                show={showChallengeViewModal}
                title={t('Challenge Details')}
                buttons={[
                    {label: (challenge.challenger ? challenge.challenger.id : '') === me.id ? t('RevokeChallenge') : t('RevokeAcceptance'), action: handleChallengeRevoke},
                    {label: t('Close'), action: handleChallengeViewClose}
                ]}
            >
                <ChallengeView challenge={challenge} me={me.id}/>
            </Modal>

            <Modal
                show={showChallengeResponseModal}
                title={t('Challenge Details')}
                buttons={[
                    {label: t('Accept'), action: () => handleChallengeResponse(true)}, {label: t('Reject'), action: () => handleChallengeResponse(false)},
                    {label: t('Close'), action: handleChallengeResponseClose}
                ]}
            >
                <ChallengeResponse challenge={challenge} me={me}/>
            </Modal>
        </article>
    );
  }
}

export default Me;
