import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { render } from '@abstractplay/renderer';
import Button from 'react-bootstrap/Button';
import { Auth } from 'aws-amplify';
import { merge } from 'lodash';
function GameMove(props) {

  const [game, gameSetter] = useState(null);
  const [renderrep, renderrepSetter] = useState(null);
  const [moveError, moveErrorSetter] = useState("");
  const [move, moveSetter] = useState("");
  const [clicked, clickedSetter] = useState("");
  const [error, errorSetter] = useState(false);
  const [errorMessage, errorMessageSetter] = useState("");
  const [gameEngine, gameEngineSetter] = useState();

  const { t } = useTranslation();
  const { state } = useLocation();

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL('https://m3y2udc717.execute-api.us-east-1.amazonaws.com/dev/query');
        url.searchParams.append('query', 'get_game');
        url.searchParams.append('id', state.game.id);
        const res = await fetch(url);
        if (res.status !== 200) {
          const result = await res.json();
          setError(JSON.parse(result.body));
        } else {
          const game0 = await res.json();
          console.log(game0);
          // the engine becomes part of the state and state variables are immutable, so I think we need
          // the engine to be just code, no state of its own.
          // Is importing this dynamically overkill? Should we just bundle all engines for everyone?
          const engine = await import('./games/' + game0.metaGame + '.js');
          if (game0.moves === undefined)
            engine.initializeGame(game0);
          game0.currentMove = game0.moves.length;
          game0.canSubmit = (game0.players[game0.toMove].id === state.myid);
          game0.exploreMove = game0.currentMove;
          gameEngineSetter(engine);
          gameSetter(game0);
          renderrepSetter(game0.renderrep);
        }
      }
      catch (error) {
        console.log(error);
        setError(error);
      }
    }
    fetchData();
  },[state]);

  const handleBoardClick = (row, col, piece) => {
    let coord = String.fromCharCode(97 + col) + (4 - row).toString();
    clickedSetter(coord);
  }

  // We don't want this to be triggered for every change to "game", so it only depends on
  // renderrep. But that means we need to remember to update the renderrep state when game.renderrep changes.
  useEffect(() => {
    if (boardImage.current !== undefined) {
      const svg = boardImage.current.querySelector('SVG');
      if (svg !== null)
        svg.remove();
    }
    if (renderrep !== null) {
      console.log(renderrep);
      render(renderrep, handleBoardClick, {divelem: boardImage.current});
    }
  }, [renderrep]);

  const setError = (error) => {
    if (error.Message !== undefined)
      errorMessageSetter(error.Message);
    else
      errorMessageSetter(JSON.stringify(error));
    errorSetter(true);
  }

  const handleView = () => {
    // probably more overkill: only clone game if we know we are going to change it.
    let err = gameEngine.badMoveReason(game, move);
    moveErrorSetter(err);
    if (err === ""){
      let tmpGame = {};
      merge(tmpGame, game);
      console.log("handleView tmpGame: ");
      console.log(tmpGame);
      gameEngine.makeMove(tmpGame, move, true);
      gameSetter(tmpGame);
      console.log("handleView tmpGame.renderrep: " + tmpGame.renderrep);
      renderrepSetter(tmpGame.renderrep);
    }
  }

  const handleSubmit = async () => {
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
      const res = await fetch('https://m3y2udc717.execute-api.us-east-1.amazonaws.com/dev/authQuery', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          "query": "submit_move",
          "pars" : {
            "id": game.id,
            "move": move
          }
        })
      });
      const result = await res.json();
      if (result.statusCode !== 200)
        setError(JSON.parse(result.body));
      let game0 = JSON.parse(result.body);
      console.log(game0);
      game0.currentMove = game0.moves.length;
      game0.canSubmit = (game0.players[game0.toMove].id === state.myid);
      game0.exploreMove = game0.currentMove;
      gameSetter(game0);
      renderrepSetter(game0.renderrep);
    }
    catch (err) {
      setError(err.message);
    }
  }

  const handleUndo = () => {
    let tmpGame = {};
    merge(tmpGame, game);
    gameEngine.undoLastMove(tmpGame, true);
    gameSetter(tmpGame);
    renderrepSetter(tmpGame.renderrep);
    moveSetter(tmpGame.moves[tmpGame.moves.length - 1]);
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
    if (game !== null) {
      return (
        <div>
          <div><h5>{game.players[game.toMove].name} to move.</h5></div>
          <div ref={boardImage} style={{width: "30%"}}></div>
          <div>{moveError}</div>
          <div>
            <label>
              {t('EnterMove')}
              <input name="move" type="text" value={move} onChange={(e) => moveSetter(e.target.value)} />
            </label>
            <Button variant="primary" onClick={handleView}>{"View"}</Button></div>
          <div>
            {game.exploreMove > game.currentMove ? <Button variant="primary" onClick={handleUndo}>{"Undo"}</Button>:""}
            {game.canSubmit && game.exploreMove === game.currentMove + 1 ? <Button variant="primary" onClick={handleSubmit}>{"Submit"}</Button>:""}
          </div>
          <div>{t('OppsMove')}</div>
        </div>
      );
    }
    else {
      return (<div></div>);
    }
  }
  else {
    return (<h4>{errorMessage}</h4>);
  }
}

export default GameMove;
