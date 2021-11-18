import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { render } from '@abstractplay/renderer';
import Button from 'react-bootstrap/Button';
import { Auth } from 'aws-amplify';
import { cloneDeep } from 'lodash';
import { API_ENDPOINT_AUTH } from '../config';
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
  const [moves, movesSetter] = useState(null);
  // const [gameEngine, gameEngineSetter] = useState();

  const { t } = useTranslation();
  const { state } = useLocation();

  const setupGame = (game0) => {
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
    gameSetter(game0);
    renderrepSetter(engine.render());
    if (game0.canSubmit || (!game0.simultaneous && game0.numPlayers === 2)) {
      if (game0.simultaneous)
        movesSetter(engine.moves(player + 1));
      else
        movesSetter(engine.moves());
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

    focusSetter({"moveNumber": history.length - 1, "exPath": []});
    explorationSetter(history);
  }

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
          setError(JSON.parse(result.body));
        } else {
          const result = await res.json();
          let game0 = JSON.parse(result.body);
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
    if (game !== null && coord !== null) {
      let engine;
      if (!game.fixedNumPlayers)
        engine = GameFactory(game.metaGame, game.numPlayers);
      else
        engine = GameFactory(game.metaGame);
      const newmove = engine.clicked(move, coord);
      moveSetter(newmove);
      coordSetter(null);
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
    if (game.simultaneous && foc.exPath.length === 1) {
      const m = game.players.map(p => (p.id === state.myid ? node.move : '')).join(',');
      engine.move(m, true);
    }
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
      let engine;
      if (!game.fixedNumPlayers)
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
    let curNode = exp[foc.moveNumber];
    for (const p of foc.exPath) {
      curNode = curNode.children[p];
    }
    return curNode;
  }

  const handleView = () => {
    let node = getFocusNode(exploration, focus);
    let gameEngineTmp = GameFactory(game.metaGame, node.state);
    console.log(gameEngineTmp.serialize());
    let partialMove = false;
    let simMove = false;
    let m = move;
    if (game.simultaneous) {
      simMove = true;
      m = game.players.map(p => (p.id === state.myid ? m : '')).join(',');
    }
    try {
      gameEngineTmp.move(m, partialMove || simMove);
    }
    catch (err) {
      moveErrorSetter(err.message);
      return;
    }
    if (!partialMove) {
      let newExploration = cloneDeep(exploration);
      node = getFocusNode(newExploration, focus);
      let newstate = gameEngineTmp.serialize();
      node.AddChild(move, newstate);
      let newfocus = cloneDeep(focus);
      newfocus.exPath.push(node.children.length - 1);
      explorationSetter(newExploration);
      focusSetter(newfocus);
      moveSetter("");
    }
    renderrepSetter(gameEngineTmp.render());
    if (game.canExplore)
      movesSetter(gameEngineTmp.moves());
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
          mover = t('ToMove', {player: game.players.find(p => p.id === state.myid).name});
        else
          mover = t('Waiting');
      }
      else {
        mover = t('ToMove', {player: game.players[game.toMove].name});
      }
      return (
        <div className="row">
          <div className="column left">
            <div className="columnTitleContainer"><h2 className="columnTitle">Make a move</h2></div>
            <div><h5>{mover}</h5></div>
            <div className="moveError">{moveError}</div>
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
                      <input name="move" type="text" value={move} onChange={(e) => handleMove(e.target.value)} />
                    </label>
                    <Button variant="primary" onClick={handleView}>{"View"}</Button>
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
    return (<h4>{errorMessage}</h4>);
  }
}

export default GameMove;
