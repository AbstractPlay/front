import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../pages/Skeleton';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer } from 'react-relay';
import { Auth } from 'aws-amplify';
import { environment } from '../Environment';
import Spinner from './Spinner';
import GameItem from './GameItem';
import ChallengeItem from './ChallengeItem';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ChallengeView from './ChallengeView';
import ChallengeResponse from './ChallengeResponse';
import ChallengeResponseMutation from './ChallengeResponseMutation'
import NewChallenge from './NewChallenge';
import NewChallengeMutation from './NewChallengeMutation'
import NewProfile from './NewProfile'

function Me(props) {
  const [myid, myidSetter] = useState(-1);
  const [challengeID, challengeIDSetter] = useState(0);
  const [vars, varsSetter] = useState({});
  const [showChallengeViewModal, showChallengeViewModalSetter] = useState(false);
  const [challengeViewError, challengeViewErrorSetter] = useState('');
  const [showChallengeResponseModal, showChallengeResponseModalSetter] = useState(false);
  const [challengeResponseError, challengeResponseErrorSetter] = useState('');
  const [showNewChallengeModal, showNewChallengeModalSetter] = useState(false);
  const [newChallengeError, newChallengeErrorSetter] = useState('');
  const [challengeGame, challengeGameSetter] = useState('');
  const [challengePlayer, challengePlayerSetter] = useState('');
  const [authed, authedSetter] = useState(true);
  const auth = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    // console.log('authed: ', authed);
    Auth.currentAuthenticatedUser().then(usr => {
      // console.log('currentAuthenticatedUser', usr);
      auth.setToken(usr.signInUserSession.idToken.jwtToken);
      // for relay Network...
      localStorage.setItem('token', usr.signInUserSession.idToken.jwtToken);
      authedSetter(true);
    }).catch(() => {
      // console.log('Not signed in');
      auth.setToken(null);
      localStorage.removeItem('token');
      authedSetter(true);
    });
  },[auth, authed]);

  const handleNewChallengeClick = (id) => {
    authedSetter(false);
    showNewChallengeModalSetter(true);
    myidSetter(id);
  }

  const handleNewChallengeClose = (id) => {
    showNewChallengeModalSetter(false);
    newChallengeErrorSetter('');
  }

  const handleChallengeViewClose = () => {
    showChallengeViewModalSetter(false);
    challengeViewErrorSetter('');
  }

  const handleChallengeRevoke = () => {
    Auth.currentAuthenticatedUser()
    .then(usr => {
      console.log('currentAuthenticatedUser', usr);
      auth.setToken(usr.signInUserSession.idToken.jwtToken);
      localStorage.setItem('token', usr.signInUserSession.idToken.jwtToken);
      ChallengeResponseMutation(challengeID, false,
        (response, errors) => {
          if (errors !== null && errors !== undefined && errors.length > 0) {
            challengeViewErrorSetter(errors);
          }
          else {
            showChallengeViewModalSetter(false);
            // the 'vars' is just to trick relay to run the query again (in order to get updated list of challenges)
            varsSetter({ dummy: challengeID });
          }
        },
        (err) => challengeViewErrorSetter(err));
      })
    .catch(() => {
      console.log('Not signed in');
      auth.setToken(null);
      localStorage.removeItem('token');
    });
  }

  const handleChallengeResponseClose = () => {
    showChallengeResponseModalSetter(false);
    challengeResponseErrorSetter('');
  }

  const handleChallengeResponse = (resp) => {
    Auth.currentAuthenticatedUser()
    .then(usr => {
      console.log('currentAuthenticatedUser', usr);
      auth.setToken(usr.signInUserSession.idToken.jwtToken);
      localStorage.setItem('token', usr.signInUserSession.idToken.jwtToken);
      ChallengeResponseMutation(challengeID, resp,
        (response, errors) => {
          if (errors !== null && errors !== undefined && errors.length > 0) {
            challengeResponseErrorSetter(errors);
          }
          else {
            showChallengeResponseModalSetter(false);
            // the 'vars' is just to trick relay to run the query again (in order to get updated list of challenges)
            varsSetter({ dummy: challengeID });
          }
        },
        (err) => challengeResponseErrorSetter(err))
      })
    .catch(() => {
      console.log('Not signed in');
      auth.setToken(null);
      localStorage.removeItem('token');
    });
  }

  const handleNewChallenge = () => {
    const game = challengeGame;
    const opponent = challengePlayer;
    Auth.currentAuthenticatedUser()
    .then(usr => {
      console.log('currentAuthenticatedUser', usr);
      auth.setToken(usr.signInUserSession.idToken.jwtToken);
      localStorage.setItem('token', usr.signInUserSession.idToken.jwtToken);
      NewChallengeMutation(game, opponent,
        (response, errors) => {
          if (errors !== null && errors !== undefined && errors.length > 0) {
            newChallengeErrorSetter(errors[0].message);
          }
          else {
            showNewChallengeModalSetter(false);
            varsSetter({ dummy: myid });
          }
        },
        (err) => newChallengeErrorSetter(err));
      })
    .catch(() => {
      console.log('Not signed in');
      auth.setToken(null);
      localStorage.removeItem('token');
    });
  }

  return (
    <div>
      <QueryRenderer
      environment={environment}
      query={graphql`
        query MeQuery {
          me {
            id,
            name,
            games {
              id,
              closed,
              type {
                name
              },
              players {
                id,
                name
              },
              whoseTurn {
                id,
                name
              },
              lastState {
                renderrep
              }
            },
            myTurn {
              id,
              type {
                name
              },
              players {
                id,
                name
              },
              whoseTurn {
                id,
                name
              },
              lastState {
                renderrep
              }
            }
            challenged {
              id,
              game {
                name
              },
              issuer {
                name,
                id
              }
            },
            challenges {
              id,
              game {
                name
              },
              numPlayers,
              players {
                name,
                id
              }
            }
          }
        }
      `}
      variables={ vars }
      render={({error, props}) => {
        if (error) {
          return <div><p>{t('Error')}</p><p>{error.message}</p></div>;
        }
        if (!props) {
          return <Spinner />;
        }
        if (props.me === null) {
          return <NewProfile show={true} varsSetter={varsSetter} />;
        }
        else {
          const myid = props.me.id.substring(3);
          // myidSetter(myid);
          return (
            <div>
              <h1>{t('WelcomePlayer', {me: props.me.name})}</h1>
              <h2>{t('Your games')}</h2>
              <h3>{t('Your move')}</h3>
                { props.me.myTurn.map(item => <GameItem me={myid} item={item} key={item.id} canMove={true} stateSetter={props.stateSetter}/>)}
              <h3>{t("Opponent's move")}</h3>
                { props.me.games
                    .filter(item => !item.whoseTurn.find(player => player.id === myid) && !item.closed)
                    .map(item => <GameItem me={myid} item={item} key={item.id} canMove={false} stateSetter={props.stateSetter}/>)}
              <h2>{t('Your challenges')}</h2>
              <h3>{t('Response needed')}</h3>
                {props.me.challenged.map(item =>
                  <ChallengeItem me={myid} item={item} key={item.id} respond={true} authed={authed}
                    setters={{
                      challengeIDSetter: challengeIDSetter,
                      showChallengeViewModalSetter: showChallengeViewModalSetter,
                      showChallengeResponseModalSetter: showChallengeResponseModalSetter,
                      authedSetter: authedSetter }} />)}
              <h3>{t('Waiting on response')}</h3>
                {props.me.challenges.map(item =>
                  <ChallengeItem me={myid} item={item} key={item.id} respond={false}
                    setters={{
                      challengeIDSetter: challengeIDSetter,
                      showChallengeViewModalSetter: showChallengeViewModalSetter,
                      showChallengeResponseModalSetter: showChallengeResponseModalSetter,
                      authedSetter: authedSetter }}/>)}
              <Button variant="primary" onClick={() => handleNewChallengeClick(myid)}>{t("IssueChallenge")}</Button>
            </div>
          );
        }
      }}
      />

      <Modal show={showChallengeViewModal} onHide={handleChallengeViewClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('Challenge Details')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{
          (!authed)?<Spinner/>:
          ((challengeViewError.length===0)?
            <ChallengeView id={challengeID} />
            : challengeViewError)}
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
          (!authed)?<Spinner/>:(
          (challengeResponseError.length===0)?
            <ChallengeResponse id={challengeID} />
            : challengeResponseError)}
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

      <Modal show={showNewChallengeModal} onHide={handleNewChallengeClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('New Challenge')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{
          (!authed)?<Spinner/>:(
          (newChallengeError.length===0)?
            <NewChallenge id={myid} setters={{
              challengeGameSetter: challengeGameSetter,
              challengePlayerSetter: challengePlayerSetter}}/>
            : newChallengeError)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleNewChallenge}>
            {t('Challenge')}
          </Button>
          <Button variant="primary" onClick={handleNewChallengeClose}>
            {t('Close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Me;
