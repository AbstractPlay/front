import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {render} from '@abstractplay/renderer';
import GameMoveMutation from './GameMoveMutation';
import Button from 'react-bootstrap/Button';
import { Auth } from 'aws-amplify';
import { useAuth } from '../pages/Skeleton';

function GameMove(props) {

  const [canMove, canMoveSetter] = useState(null);
  const [game, gameSetter] = useState(null);
  const [move, moveSetter] = useState("");
  const [clicked, clickedSetter] = useState("");
  const [error, errorSetter] = useState(false);
  const [errorMessage, errorMessageSetter] = useState("");

  const auth = useAuth();
  const history = useHistory();
  const { t } = useTranslation();

  const { state } = useLocation();
  if (game === null) {
    canMoveSetter(state.canMove);
    gameSetter(state.game);
  }

  const handleBoardClick = (row, col, piece) => {
    let coord = String.fromCharCode(97 + col) + (4 - row).toString();
    clickedSetter(coord);
  }

  useEffect(() => {
    const svg = boardImage.current.querySelector('SVG');
    if (svg != null)
      svg.remove();
    render(JSON.parse(game.lastState.renderrep), handleBoardClick, {divelem: boardImage.current});
  },[game]);

  const setError = (message) => {
    errorSetter(true);
    errorMessageSetter(message);
  }

  const handleSubmit = () => {
    Auth.currentAuthenticatedUser()
    .then(usr => {
      console.log('currentAuthenticatedUser', usr);
      auth.setToken(usr.signInUserSession.idToken.jwtToken);
      localStorage.setItem('token', usr.signInUserSession.idToken.jwtToken);
      const id = game.id;
      GameMoveMutation(id, move,
        (response, errors) => {
          if (errors !== null && errors !== undefined && errors.length > 0) {
            setError(errors[0].message);
          }
          else {
            history.replace("/move", {canMove: false, game: response.moveGame});
            gameSetter(response.moveGame);
            canMoveSetter(false);
          }
        },
        setError);
      })
    .catch(() => {
      console.log('Not signed in');
      auth.setToken(null);
      localStorage.removeItem('token');
    });
  }

  const boardImage = useRef();
  if (clicked.length > 0) {
    if (move.length > 0 && move.length < 5)
      moveSetter(move + '-' + clicked);
    else
      moveSetter(clicked);
    clickedSetter("");
  }
  if (!error) {
    return (
      <div>
        <div ref={boardImage} style={{width: "30%"}}></div>
        {(canMove)?
          <div>
            <label>
              {t('EnterMove')}
              <input name="move" type="text" value={move} onChange={(e) => moveSetter(e.target.value)} />
            </label>
            <Button variant="primary" onClick={handleSubmit}>{"Submit"}</Button></div>:
          <div>{t('OppsMove')}</div>}
      </div>
    );
  }
  else {
    return (<h4>{errorMessage}</h4>);
  }
}

export default GameMove;
