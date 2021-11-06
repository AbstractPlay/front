import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { render } from '@abstractplay/renderer';
import Button from 'react-bootstrap/Button';
import { Auth } from 'aws-amplify';
import { cloneDeep } from 'lodash';
import { API_ENDPOINT_OPEN, API_ENDPOINT_AUTH } from '../config';
import { GameNode } from './GameTree.js';
import { gameinfo, GameFactory } from '@abstractplay/gameslib';

function GameMove(props) {
  const [game, gameSetter] = useState(null);
  const [renderrep, renderrepSetter] = useState(null);
  // Game tree of explored moves at each history move. For games that are not complete, only at the last move.
  const [exploration, explorationSetter] = useState(null);
  // What place in the tree the display is currently showing. If history, just the move number. If exploration, the move from which we are exploring and then the path through the tree.
  const [focus, focusSetter] = useState(null);
  const [moveError, moveErrorSetter] = useState("");
  const [coord, coordSetter] = useState("");
  const [move, moveSetter] = useState("");
  const [error, errorSetter] = useState(false);
  const [errorMessage, errorMessageSetter] = useState("");
  // const [gameEngine, gameEngineSetter] = useState();

  const { t } = useTranslation();
  const { state } = useLocation();

  const setupGame = (game0) => {
    let engine;
    const info = gameinfo.get(game0.metaGame);
    if (game0.state === undefined) {
      if (info.playercounts.length > 1)
        engine = GameFactory(game0.metaGame, game0.players.length);
      else
        engine = GameFactory(game0.metaGame);
    } else {
      engine = GameFactory(game0.metaGame, game0.state);
    }
    game0.canSubmit = (game0.players[game0.toMove].id === state.myid);
    gameSetter(game0);
    renderrepSetter(engine.render());
    // fill in history
    let gameEngineTmp;
    const numplayers = game0.players.length;
    if (info.playercounts.length > 1)
      gameEngineTmp = GameFactory(game0.metaGame, numplayers);
    else
      gameEngineTmp = GameFactory(game0.metaGame);
    let moves = [];
    for (let round of engine.moveHistory())
      for (let m of round)
        moves.push(m);
    let history = [];
    let toMove = 0;
    history.push(new GameNode(null, null, gameEngineTmp.serialize(), toMove));
    for (const m of moves) {
      gameEngineTmp.move(m);
      toMove = (toMove + 1) % numplayers;
      history.push(new GameNode(null, m, gameEngineTmp.serialize(), toMove));
    }
    focusSetter([moves.length, []]);
    explorationSetter(history);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'get_game');
        url.searchParams.append('id', state.game.id);
        const res = await fetch(url);
        if (res.status !== 200) {
          const result = await res.json();
          setError(JSON.parse(result.body));
        } else {
          const game0 = await res.json();
          console.log(game0);
          setupGame(game0);
        }
      }
      catch (error) {
        console.log(error);
        setError(error);
      }
    }
    fetchData();
  },[state]);

  useEffect(() => {
    if (game !== null) {
      const info = gameinfo.get(game.metaGame);
      let engine;
      if (info.playercounts.length > 1)
        engine = GameFactory(game.metaGame, game.numPlayers);
      else
        engine = GameFactory(game.metaGame);
      const newmove = engine.clicked(move, coord);
      moveSetter(newmove);
    }
  },[coord]);

  const handleMove = (value) => {
    moveSetter(value);
    moveErrorSetter("");
  }

  const handleGameMoveClick = (foc) => {
    focusSetter(foc);
    let node = getFocusNode(exploration, foc);
    let engine = GameFactory(game.metaGame, node.state);
    renderrepSetter(engine.render());
    moveErrorSetter("");
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
      const info = gameinfo.get(game.metaGame);
      let engine;
      if (info.playercounts.length > 1)
        engine = GameFactory(game.metaGame, game.numPlayers);
      else
        engine = GameFactory(game.metaGame);
      const handleBoardClick = (row, col, piece) => {
        const coord = engine.click(row, col, piece);
        coordSetter(coord);
        moveErrorSetter("");
      }
      render(renderrep, {"divid": "svg", "boardClick": handleBoardClick});
    }
  }, [renderrep]);

  const setError = (error) => {
    if (error.Message !== undefined)
      errorMessageSetter(error.Message);
    else
      errorMessageSetter(JSON.stringify(error));
    errorSetter(true);
  }

  const getFocusNode = (exp, foc) => {
    let curNode = exp[foc[0]];
    for (const p of foc[1]) {
      curNode = curNode.children[p];
    }
    return curNode;
  }

  const handleView = () => {
    let node = getFocusNode(exploration, focus);
    let gameEngineTmp = GameFactory(game.metaGame, node.state);
    try {
      gameEngineTmp.move(move);
    }
    catch (err) {
      moveErrorSetter(err.message);
      return;
    }
    let newExploration = cloneDeep(exploration);
    node = getFocusNode(newExploration, focus);
    let newstate = gameEngineTmp.serialize();
    node.AddChild(move, newstate);
    let newfocus = cloneDeep(focus);
    newfocus[1].push(node.children.length - 1);
    explorationSetter(newExploration);
    focusSetter(newfocus);
    renderrepSetter(gameEngineTmp.render());
  }

  const handleMarkAsWin = () => {
    handleMark(1);
  }

  const handleMarkAsLoss = () => {
    handleMark(-1);
  }

  const handleMark = (mark) => {
    let newExploration = cloneDeep(exploration);
    let node = getFocusNode(newExploration, focus);
    node.SetOutcome(mark);
    explorationSetter(newExploration);
  }

  const handleSubmit = async () => {
    let m = getFocusNode(exploration, focus).move;
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
      const res = await fetch(API_ENDPOINT_AUTH, {
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
            "move": m
          }
        })
      });
      const result = await res.json();
      if (result.statusCode !== 200)
        setError(JSON.parse(result.body));
      let game0 = JSON.parse(result.body);
      console.log("In handleSubmit. game0:");
      console.log(game0);
      setupGame(game0);
    }
    catch (err) {
      setError(err.message);
    }
  }

  const boardImage = useRef();

  if (!error) {
    if (game !== null) {
      let moveRows = [];
      if (exploration !== null) {
        let path = [];
        for (let i = 1; i < exploration.length; i++) {
          let className = "gameMove";
          if (i === focus[0] && (i < exploration.length - 1 || (i === exploration.length - 1 && focus[1].length === 0)))
            className += " gameMoveFocus";
          path.push([{"class": className, "move": exploration[i].move, "path": [i, []]}]);
        }
        if (focus[0] === exploration.length - 1) {
          let node = exploration[focus[0]];
          for (let j = 0; j < focus[1].length; j++) {
            let className = "gameMove";
            if (j === focus[1].length - 1)
              className += " gameMoveFocus";
            node = node.children[focus[1][j]];
            if (node.outcome === 0)
              className += " gameMoveUnknownOutcome";
            else if (node.outcome === -1)
              className += " gameMoveLoss";
            else if (node.outcome === 1)
              className += " gameMoveWin";
            path.push([{"class": className, "move": node.move, "path": [focus[0], focus[1].slice(0, j + 1)]}]);
          }
          if (node.children.length > 0) {
            let next = [];
            for (let k = 0; k < node.children.length; k++) {
              const c = node.children[k];
              let className = "gameMove";
              if (c.outcome === 0)
                className += " gameMoveUnknownOutcome";
              else if (c.outcome === -1)
                className += " gameMoveLoss";
              else if (c.outcome === 1)
                className += " gameMoveWin";
              next.push({"class": className, "move": c.move, "path": [focus[0], focus[1].concat(k)]})
            }
            path.push(next);
          }
        }
        for (let i = 0; i < Math.ceil(path.length / 2); i++) {
          moveRows.push([path[2 * i], 2 * i + 1 === path.length ? [] : path[2 * i + 1]]);
        }
      }
      return (
        <div className="row">
          <div className="column left">
            <div className="columnTitleContainer"><h2 className="columnTitle">Make a move</h2></div>
            <div><h5>{game.players[game.toMove].name} to move.</h5></div>
            <div className="moveError">{moveError}</div>
            { exploration !== null && focus[0] === exploration.length - 1 ?
                <div>
                  <label>
                    {t('EnterMove')}
                    <input name="move" type="text" value={move} onChange={(e) => handleMove(e.target.value)} />
                  </label>
                  <Button variant="primary" onClick={handleView}>{"View"}</Button>
                  <div>
                    { game.canSubmit && focus[1].length === 1 ? <Button variant="primary" onClick={handleSubmit}>{"Submit"}</Button>:""}
                    { focus[1].length > 0 ? <Button variant="primary" onClick={handleMarkAsWin}>{"Mark as win"}</Button>:""}
                    { focus[1].length > 0 ? <Button variant="primary" onClick={handleMarkAsLoss}>{"Mark as loss"}</Button>:""}
                  </div>
                </div>
                : <div/>
            }
          </div>
          <div className="column middle">
            <div className="columnTitleContainer"><h2 className="columnTitle">Board</h2></div>
            <div className="board" id="svg" ref={boardImage} style={{width: "100%"}}></div>
          </div>
          <div className="column right gameMovesContainer">
            <div className="columnTitleContainer"><h2 className="columnTitle">Moves</h2></div>
            <div className="gameMoves">
              <table className="striped movesTable">
                <tbody>
                  { moveRows.map((row, index) =>
                    <tr key={"move" + index}>
                      <td>{(2 * index + 1) + '.'}</td>
                      <td>
                        { row[0].map((m, i) =>
                          <div key={"move" + index + "-0-" + i} className="gameMove">{i > 0 ? ", ": ""}
                            <div className={m.class} onClick={() => handleGameMoveClick(m.path)}>
                              {m.move}
                            </div>
                          </div>)
                        }
                      </td>
                      <td className="gameMoveMiddleCol">{row[1].length > 0 ? (2 * index + 2) + '.' : ''}</td>
                      <td>
                        { row[1].map((m, i) =>
                          <div key={"move" + index + "-1-" + i}>{i > 0 ? ", ": ""}
                            <div className={m.class} onClick={() => handleGameMoveClick(m.path)}>
                              {m.move}
                            </div>
                          </div>)
                        }
                      </td>
                    </tr>)
                  }
                </tbody>
              </table>
            </div>
          </div>
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
