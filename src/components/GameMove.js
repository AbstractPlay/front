import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { render } from '@abstractplay/renderer';
import Button from 'react-bootstrap/Button';
import { Auth } from 'aws-amplify';
import { cloneDeep } from 'lodash';
import { API_ENDPOINT_AUTH } from '../config';
import { GameNode } from './GameTree.js';
import { gameinfo, GameFactory, addResource } from '@abstractplay/gameslib';

function setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, movesRef, focusSetter, explorationRef) {
  let engine;
  const info = gameinfo.get(game0.metaGame);
  game0.simultaneous = (info.flags !== undefined && info.flags.includes('simultaneous'));
  game0.fixedNumPlayers = info.playercounts.length === 1;
  if (game0.state === undefined) {
    throw new Error("Why no state? This shouldn't happen no more!");
  } else {
    engine = GameFactory(game0.metaGame, game0.state);
  }
  let player = -1;
  if (game0.simultaneous) {
    game0.canSubmit = false;
    for (let i = 0; i < game0.numPlayers; i++)
      if (game0.players[i].id === state.myid) {
        game0.canSubmit = game0.toMove[i];
        player = i;
      }
    if (game0.partialMove !== undefined && game0.partialMove.length > game0.numPlayers - 1)
      engine.move(game0.partialMove, true);
    game0.canExplore = false;
  }
  else {
    game0.canSubmit = (game0.players[game0.toMove].id === state.myid);
    game0.canExplore = game0.canSubmit || game0.numPlayers === 2;
  }
  gameRef.current = game0;
  partialMoveRenderRef.current = false;
  const render = engine.render();
  if (game0.canSubmit || (!game0.simultaneous && game0.numPlayers === 2)) {
    if (game0.simultaneous)
      movesRef.current = engine.moves(player + 1);
    else
      movesRef.current = engine.moves();
  }
  let history = [];
  let toMove = game0.toMove;
  const numplayers = game0.players.length;
  if (game0.simultaneous)
    toMove = game0.players.map(p => true);
  /*eslint-disable no-constant-condition*/
  while (true) {
    // maybe last move should be the last numPlayers moves for simul games?
    let lastmove = null;
    if (Array.isArray(engine.stack[engine.stack.length - 1].lastmove))
      lastmove = engine.stack[engine.stack.length - 1].lastmove.join(', ');
    else
      lastmove = engine.stack[engine.stack.length - 1].lastmove;
    history.unshift(new GameNode(null, lastmove, engine.serialize(), toMove));
    engine.stack.pop();
    if (engine.stack.length === 0)
      break;
    engine.load();
    if (!game0.simultaneous)
      toMove = (toMove + 1) % numplayers;
  }

  explorationRef.current = history;
  focusSetter({"moveNumber": history.length - 1, "exPath": []});
  renderrepSetter(render);
}

function doView(state, game, move, explorationRef, focus, errorMessageRef, errorSetter, focusSetter, moveSetter, partialMoveRenderRef, renderrepSetter, movesRef) {
  let node = getFocusNode(explorationRef.current, focus);
  let gameEngineTmp = GameFactory(game.metaGame, node.state);
  console.log(gameEngineTmp.serialize());
  let partialMove = false;
  if (move.valid && move.complete === -1 && move.canrender === true)
    partialMove = true;
  let simMove = false;
  let m = move.move;
  if (game.simultaneous) {
    simMove = true;
    m = game.players.map(p => (p.id === state.myid ? m : '')).join(',');
  }
  try {
    gameEngineTmp.move(m, partialMove || simMove);
  }
  catch (err) {
    if (err.name === "UserFacingError") {
      errorMessageRef.current = err.client;
    } else {
      errorMessageRef.current = err.message;
    }
    errorSetter(true);
    return;
  }
  if (!partialMove) {
    node = getFocusNode(explorationRef.current, focus);
    let newstate = gameEngineTmp.serialize();
    node.AddChild(move.move, newstate);
    let newfocus = cloneDeep(focus);
    newfocus.exPath.push(node.children.length - 1);
    focusSetter(newfocus);
    moveSetter({"move": '', "valid": true, "message": '', "complete": 0, "previous": ''});
  }
  partialMoveRenderRef.current = partialMove;
  renderrepSetter(gameEngineTmp.render());
  if (game.canExplore && !partialMove)
    movesRef.current = gameEngineTmp.moves();
}

function getFocusNode(exp, foc) {
  let curNode = exp[foc.moveNumber];
  for (const p of foc.exPath) {
    curNode = curNode.children[p];
  }
  return curNode;
}

function GameMove(props) {
  const gameRef = useRef(null);
  const [renderrep, renderrepSetter] = useState(null);
  // Game tree of explored moves at each history move. For games that are not complete, only at the last move.
  const explorationRef = useRef(null);
  // What place in the tree the display is currently showing. If history, just the move number. If exploration, the move from which we are exploring and then the path through the tree.
  const [focus, focusSetter] = useState(null);
  const [move, moveSetter] = useState({"move": '', "valid": true, "message": '', "complete": 0, "previous": ''});
  const [error, errorSetter] = useState(false);
  const errorMessageRef = useRef("");
  const movesRef = useRef(null);
  const partialMoveRenderRef = useRef(false);
  const focusRef = useRef();
  focusRef.current = focus;
  const moveRef = useRef();
  moveRef.current = move;

  const { t, i18n } = useTranslation();
  const { state } = useLocation();

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  useEffect(() => {
    async function fetchData() {
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
            "query": "get_game",
            "pars" : {
              "id": state.game.id
            }
          })
        });
        if (res.status !== 200) {
          const result = await res.json();
          errorMessageRef.current = JSON.parse(result.body);
          errorSetter(true);
        } else {
          const result = await res.json();
          let game0 = JSON.parse(result.body);
          setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, movesRef, focusSetter, explorationRef);
        }
      }
      catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }
    fetchData();
  },[state, renderrepSetter, focusSetter]);

  const handleMove = (value) => {
    let node = getFocusNode(explorationRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    const result = gameEngineTmp.validateMove(value);
    result.move = value;
    result.previous = move.move;
    moveSetter(result);
  }

  const handleView = () => {
    doView(state, gameRef.current, move, explorationRef, focus, errorSetter, focusSetter, moveSetter, partialMoveRenderRef, renderrepSetter, movesRef);
  }

  const handleGameMoveClick = (foc) => {
    focusSetter(foc);
    let node = getFocusNode(explorationRef.current, foc);
    let engine = GameFactory(gameRef.current.metaGame, node.state);
    if (gameRef.current.simultaneous && foc.exPath.length === 1) {
      const m = gameRef.current.players.map(p => (p.id === state.myid ? node.move : '')).join(',');
      engine.move(m, true);
    }
    partialMoveRenderRef.current = false;
    renderrepSetter(engine.render());
  }

  useEffect(() => {
    if ((move.valid && move.complete > -1 && move.move !== '') || (move.canrender === true)) {
      doView(state, gameRef.current, move, explorationRef, focus, errorMessageRef, errorSetter, focusSetter, moveSetter, partialMoveRenderRef, renderrepSetter, movesRef);
    }
    else if (partialMoveRenderRef.current && !move.move.startsWith(move.previous)) {
      let node = getFocusNode(explorationRef.current, focus);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      partialMoveRenderRef.current = false;
      renderrepSetter(gameEngineTmp.render());
      if (gameRef.current.canExplore)
        movesRef.current = gameEngineTmp.moves();
    }
  }, [state, move, focus]);

  // We don't want this to be triggered for every change to "game", so it only depends on
  // renderrep. But that means we need to remember to update the renderrep state when game.renderrep changes.
  useEffect(() => {
    function boardClick(row, col, piece) {
      // console.log("Row: " + row + ", Col: " + col + ", Piece: " + piece);
      let node = getFocusNode(explorationRef.current, focusRef.current);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      var result = gameEngineTmp.handleClick(moveRef.current.move, row, col);
      result.previous = moveRef.current.move;
      moveSetter(result);
    }

    if (boardImage.current !== undefined) {
      const svg = boardImage.current.querySelector('SVG');
      if (svg !== null)
        svg.remove();
    }
    if (renderrep !== null) {
      console.log(renderrep);
      render(renderrep, {"divid": "svg", "boardClick": boardClick});
    }
  }, [renderrep, moveSetter]);

  const setError = (error) => {
    if (error.Message !== undefined)
      errorMessageRef.current = error.Message;
    else
    errorMessageRef.current = JSON.stringify(error);
    errorSetter(true);
  }

  const handleMarkAsWin = () => {
    handleMark(1);
  }

  const handleMarkAsLoss = () => {
    handleMark(-1);
  }

  const handleMark = (mark) => {
    let node = getFocusNode(explorationRef.current, focus);
    node.SetOutcome(mark);
  }

  const handleSubmit = async () => {
    let m = getFocusNode(explorationRef.current, focus).move;
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
            "id": gameRef.current.id,
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
      setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, movesRef, focusSetter, explorationRef);
    }
    catch (err) {
      setError(err.message);
    }
  }

  const boardImage = useRef();
  const game = gameRef.current;
  const exploration = explorationRef.current;
  const moves = movesRef.current;
  if (!error) {
    if (focus !== null) {
      let moveRows = [];
      const simul = game.simultaneous;
      if (exploration !== null) {
        let path = [];
        for (let i = 1; i < exploration.length; i++) {
          let className = "gameMove";
          if (i === focus.moveNumber && (i < exploration.length - 1 || (i === exploration.length - 1 && focus.exPath.length === 0)))
            className += " gameMoveFocus";
          path.push([{"class": className, "move": exploration[i].move, "path": {"moveNumber": i, "exPath": []}}]);
        }
        if (focus.moveNumber === exploration.length - 1) {
          let node = exploration[focus.moveNumber];
          for (let j = 0; j < focus.exPath.length; j++) {
            let className = "gameMove";
            if (j === focus.exPath.length - 1)
              className += " gameMoveFocus";
            node = node.children[focus.exPath[j]];
            if (node.outcome === 0)
              className += " gameMoveUnknownOutcome";
            else if (node.outcome === -1)
              className += " gameMoveLoss";
            else if (node.outcome === 1)
              className += " gameMoveWin";
            path.push([{"class": className, "move": node.move, "path": {"moveNumber": focus.moveNumber, "exPath": focus.exPath.slice(0, j + 1)}}]);
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
              next.push({"class": className, "move": c.move, "path": {"moveNumber": focus.moveNumber, "exPath": focus.exPath.concat(k)}})
            }
            path.push(next);
          }
        }
        let numcolumns = simul ? 1 : game.numPlayers;
        for (let i = 0; i < Math.ceil(path.length / numcolumns); i++) {
          let row = [];
          for (let j = 0; j < numcolumns; j++) {
            let clName = j === 0 ? "gameMoveLeftCol" : "gameMoveMiddleCol";
            let movenum = numcolumns * i + j;
            row.push(<td key={'td0-'+i+'-'+j} className={clName}>{movenum >= path.length ? '' : (movenum+1) + '.'}</td>);
            if (movenum < path.length) {
              row.push(
                <td key={'td1-'+i+'-'+j}>
                  { path[movenum].map((m, k) =>
                    <div key={"move" + i + "-" + j + "-" + k}>{k > 0 ? ", ": ""}
                      <div className={m.class} onClick={() => handleGameMoveClick(m.path)}>
                        {m.move}
                      </div>
                    </div>)
                  }
                </td>);
            }
            else {
              row.push(<td key={'td1-'+i+'-'+j}></td>);
            }
          }
          moveRows.push(row);
        }
      }
      let mover = '';
      if (game.simultaneous) {
        if (game.canSubmit)
          mover = t('ToMove', {"player": game.players.find(p => p.id === state.myid).name});
        else
          mover = t('Waiting');
      }
      else {
        mover = t('ToMove', {"player": game.players[game.toMove].name});
      }
      return (
        <div className="row">
          <div className="column left">
            <div className="columnTitleContainer"><h2 className="columnTitle">Make a move</h2></div>
            <div><h5>{mover}</h5></div>
            { !move.valid || (move.valid && move.complete === -1)  ?
              <div className={ move.valid ? "moveMessage" : "moveError"}>{move.message}</div> :
              ''
            }
            { (game.canSubmit || game.canExplore) && exploration !== null && focus.moveNumber === exploration.length - 1
              && (game.canExplore || focus.exPath.length === 0) ?
                <div>
                  <div>
                    { moves === null ? <div/> :
                      <div>
                        <label>{t("ChooseMove")}</label>
                        <select name="moves" id="selectmove" onChange={(e) => handleMove(e.target.value)}>
                        <option value="">--{t('Select')}--</option>
                          { moves.map((move, index) => { return <option key={index} value={move}>{move}</option>})}
                        </select>
                      </div>
                    }
                  </div>
                  <div>
                    <label>
                      {t('EnterMove')}
                      <input name="move" type="text" value={move.move} onChange={(e) => handleMove(e.target.value)} />
                    </label>
                    { move.valid && move.complete === -1 ?
                      <Button variant="primary" onClick={handleView}>{"View"}</Button>
                      : ''
                    }
                  </div>
                  <div>
                    { game.canSubmit && focus.exPath.length === 1 ?
                      <Button variant="primary" onClick={handleSubmit}>{"Submit"}</Button> : ""
                    }
                    { focus.exPath.length > 0 && game.canExplore ?
                      <Button variant="primary" onClick={handleMarkAsWin}>{"Mark as win"}</Button>:""
                    }
                    { focus.exPath.length > 0 && game.canExplore ?
                      <Button variant="primary" onClick={handleMarkAsLoss}>{"Mark as loss"}</Button>:""
                    }
                  </div>
                </div>
                : (game.canSubmit && exploration !== null && focus.moveNumber === exploration.length - 1
                    && focus.exPath.length === 1) ?
                    <Button variant="primary" onClick={handleSubmit}>{"Submit"}</Button>
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
                      { row }
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
    return (<h4>{errorMessageRef.current}</h4>);
  }
}

export default GameMove;
