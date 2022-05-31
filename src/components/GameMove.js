import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { render, renderglyph } from '@abstractplay/renderer';
import { Auth } from 'aws-amplify';
import { cloneDeep } from 'lodash';
import { API_ENDPOINT_AUTH } from '../config';
import { GameNode } from './GameTree';
import { gameinfo, GameFactory, addResource } from '@abstractplay/gameslib';
import GameStatus from './GameStatus'
import MoveEntry from './MoveEntry';
import MoveResults from './MoveResults';
import RenderOptionsModal from './RenderOptionsModal';
import Modal from './Modal';

function getSetting(setting, deflt, gameSettings, userSettings, metaGame) {
  if (gameSettings !== undefined && gameSettings[setting] !== undefined) {
    return gameSettings[setting];
  } else if (userSettings !== undefined) {
    if (userSettings[metaGame] !== undefined && userSettings[metaGame][setting] !== undefined) {
      return userSettings[metaGame][setting];
    } else if (userSettings.all !== undefined && userSettings.all[setting] !== undefined) {
      return userSettings.all[setting];
    } else {
      return deflt;
    }
  }
  else {
    return deflt;
  }
}

function setStatus(engine, game, status) {
  if (game.scores) {
    status.scores = [];
    for (let i = 1; i <= game.numPlayers; i++) {
      status.scores.push(engine.getPlayerScore(i));
    }
  }
  if (game.limitedPieces) {
    status.pieces = [];
    for (let i = 1; i <= game.numPlayers; i++) {
      status.pieces.push(engine.getPlayerPieces(i));
    }
  }
  if (game.playerStashes) {
    status.stashes = [];
    for (let i = 1; i <= game.numPlayers; i++) {
      status.stashes.push(engine.getPlayerStash(i));
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, statusRef, movesRef, focusSetter, explorationRef, t) {
  const info = gameinfo.get(game0.metaGame);
  game0.name = info.name;
  game0.simultaneous = (info.flags !== undefined && info.flags.includes('simultaneous'));
  game0.sharedPieces = (info.flags !== undefined && info.flags.includes('shared-pieces'));
  game0.perspective = (info.flags !== undefined && info.flags.includes('perspective'));
  game0.scores = (info.flags !== undefined && info.flags.includes('scores'));
  game0.limitedPieces = (info.flags !== undefined && info.flags.includes('limited-pieces'));
  game0.playerStashes = (info.flags !== undefined && info.flags.includes('player-stashes'));
  game0.noMoves = (info.flags !== undefined && info.flags.includes('no-moves'));
  game0.stackExpanding = (info.flags !== undefined && info.flags.includes('stacking-expanding'));
  game0.fixedNumPlayers = info.playercounts.length === 1;
  if (game0.state === undefined)
    throw new Error("Why no state? This shouldn't happen no more!");
  const engine = GameFactory(game0.metaGame, game0.state);
  let player = -1;
  if (game0.simultaneous) {
    game0.canSubmit = false;
    if (game0.toMove !== "") {
      for (let i = 0; i < game0.numPlayers; i++) {
        if (game0.players[i].id === state.myid) {
          game0.canSubmit = game0.toMove[i];
          player = i;
        }
      }
      if (game0.partialMove !== undefined && game0.partialMove.length > game0.numPlayers - 1)
        engine.move(game0.partialMove, true);
    }
    game0.canExplore = false;
  }
  else {
    game0.canSubmit = (game0.toMove !== "" && game0.players[game0.toMove].id === state.myid);
    game0.canExplore = game0.canSubmit || (game0.toMove !== "" && game0.numPlayers === 2);
  }
  if (typeof engine.chatLog === "function") {
    game0.moveResults = engine.chatLog(game0.players.map(p => p.name)).reverse().map((e) => {return {"time": e[0], "log": e.slice(1).join(" ")};});
  } else {
    game0.moveResults = engine.resultsHistory().reverse();
  }
  gameRef.current = game0;
  partialMoveRenderRef.current = false;
  const render = engine.render();
  setStatus(engine, game0, statusRef.current);
  if (!game0.noMoves && (game0.canSubmit || (!game0.simultaneous && game0.numPlayers === 2))) {
    if (game0.simultaneous)
      movesRef.current = engine.moves(player + 1);
    else
      movesRef.current = engine.moves();
  }
  let history = [];
  let toMove = game0.toMove;
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
    history.unshift(new GameNode(null, lastmove, engine.serialize(), engine.stack[engine.stack.length - 1].currplayer - 1));
    engine.stack.pop();
    if (engine.stack.length === 0)
      break;
    engine.load();
  }
  explorationRef.current = history;
  focusSetter({"moveNumber": history.length - 1, "exPath": []});
  console.log("Setting renderrep");
  renderrepSetter(render);
}

function setupColors(settings, game, t) {
  var options = {};
  if (settings.color === "blind") {
      options.colourBlind = true;
  } else if (settings.color === "patterns") {
      options.patterns = true;
  }
  game.colors = game.players.map((p, i) => {
    if (game.sharedPieces) {
      return {"isImage": false, "value": t("Player") + (i+1).toString()}
    } else {
      return {"isImage": true, "value": renderglyph("piece", i + 1, options)}
    }
  });
}

function doView(state, game, move, explorationRef, focus, errorMessageRef, errorSetter, focusSetter, moveSetter,
  partialMoveRenderRef, renderrepSetter, movesRef, statusRef) {
  let node = getFocusNode(explorationRef.current, focus);
  let gameEngineTmp = GameFactory(game.metaGame, node.state);
  let partialMove = false;
  if (move.valid && move.complete < 1 && move.canrender === true)
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
    setStatus(gameEngineTmp, game, statusRef.current);
    node = getFocusNode(explorationRef.current, focus);
    let newstate = gameEngineTmp.serialize();
    const pos = node.AddChild(move.move, newstate);
    let newfocus = cloneDeep(focus);
    newfocus.exPath.push(pos);
    focusSetter(newfocus);
    moveSetter({"move": '', "valid": true, "message": '', "complete": 0, "previous": ''});
  }
  partialMoveRenderRef.current = partialMove;
  if (!game.noMoves && game.canExplore && !partialMove)
    movesRef.current = gameEngineTmp.moves();
  renderrepSetter(gameEngineTmp.render());
}

function getFocusNode(exp, foc) {
  let curNode = exp[foc.moveNumber];
  for (const p of foc.exPath) {
    curNode = curNode.children[p];
  }
  return curNode;
}

function useEventListener(eventName, handler, element = window){
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(
    () => {
      const isSupported = element && element.addEventListener;
      if (!isSupported) return;

      const eventListener = event => savedHandler.current(event);
      element.addEventListener(eventName, eventListener);

      // Remove event listener on cleanup
      return () => {
        element.removeEventListener(eventName, eventListener);
      };
    },
    [eventName, element] // Re-run if eventName or element changes
  );
}

function getPath(focus, exploration, path) {
  let curNumVariations = 0;
  for (let i = 1; i < exploration.length; i++) {
    path.push([{"moveNumber": i, "exPath": []}]);
  }
  if (focus.moveNumber === exploration.length - 1) {
    let node = exploration[focus.moveNumber];
    for (let j = 0; j < focus.exPath.length; j++) {
      curNumVariations = node.children.length;
      node = node.children[focus.exPath[j]];
      path.push([{"moveNumber": focus.moveNumber, "exPath": focus.exPath.slice(0, j + 1)}]);
    }
    while (node.children.length > 0) {
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
        next.push({"moveNumber": focus.moveNumber, "exPath": focus.exPath.concat(k)});
      }
      path.push(next);
      if (node.children.length !== 1)
        break;
      node = node.children[0];
    }
  }
  return curNumVariations;
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
  const [showSettings, showSettingsSetter] = useState(false);
  const [showResignConfirm, showResignConfirmSetter] = useState(false);
  const [userSettings, userSettingsSetter] = useState();
  const [gameSettings, gameSettingsSetter] = useState();
  const [settings, settingsSetter] = useState(null);
  const [wait, waitSetter] = useState(0);
  const errorMessageRef = useRef("");
  const movesRef = useRef(null);
  const statusRef = useRef({});
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
          console.log(game0);
          setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, statusRef, movesRef, focusSetter, explorationRef, t);
          userSettingsSetter(state.settings);
          gameSettingsSetter(game0.players.find(p => p.id === state.myid).settings);
        }
      }
      catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }
    fetchData();
  }, [state, renderrepSetter, focusSetter, t]);

  const handleMove = (value) => {
    let node = getFocusNode(explorationRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    const result = gameEngineTmp.validateMove(value);
    result.move = value;
    result.previous = move.move;
    moveSetter(result);
  }

  const handleView = () => {
    const newmove = cloneDeep(move);
    newmove.complete = 1;
    moveSetter(newmove);
  }

  const handleGameMoveClick = (foc) => {
    console.log("foc = ", foc);
    let node = getFocusNode(explorationRef.current, foc);
    let engine = GameFactory(gameRef.current.metaGame, node.state);
    if (gameRef.current.simultaneous && foc.exPath.length === 1) {
      const m = gameRef.current.players.map(p => (p.id === state.myid ? node.move : '')).join(',');
      engine.move(m, true);
    }
    partialMoveRenderRef.current = false;
    if (!gameRef.current.noMoves && foc.moveNumber === explorationRef.current.length - 1) {
      movesRef.current = engine.moves();
    }
    focusSetter(foc);
    renderrepSetter(engine.render());
    setStatus(engine, gameRef.current, statusRef.current);
    moveSetter({"move": '', "valid": true, "message": '', "complete": 0, "previous": ''});
  }

  useEffect(() => {
    if ((move.valid && move.complete > -1 && move.move !== '') || (move.canrender === true)) {
      doView(state, gameRef.current, move, explorationRef, focus, errorMessageRef, errorSetter, focusSetter, moveSetter,
        partialMoveRenderRef, renderrepSetter, movesRef, statusRef);
    }
    else if (partialMoveRenderRef.current && !move.move.startsWith(move.previous)) {
      let node = getFocusNode(explorationRef.current, focus);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      partialMoveRenderRef.current = false;
      setStatus(gameEngineTmp, gameRef.current, statusRef.current);
      if (!gameRef.current.noMoves && gameRef.current.canExplore)
        movesRef.current = gameEngineTmp.moves();
      renderrepSetter(gameEngineTmp.render());
    }
  }, [state, move, focus]);

  // We don't want this to be triggered for every change to "game", so it only depends on
  // renderrep. But that means we need to remember to update the renderrep state when game.renderrep changes.
  useEffect(() => {
    let options = {};

    const waiter = async () => {
      await sleep(50);
      waitSetter(wait + 1);
      console.log("wait", wait);
    }
    
    function boardClick(row, col, piece) {
      let node = getFocusNode(explorationRef.current, focusRef.current);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      var result = gameEngineTmp.handleClick(moveRef.current.move, row, col, piece);
      result.previous = moveRef.current.move;
      console.log(`boardClick:(${row},${col},${piece})`,result);
      moveSetter(result);
    }

    function expand(row, col) {
      let node = getFocusNode(explorationRef.current, focusRef.current);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      const svg = stackImage.current.querySelector('svg');
      if (svg !== null)
        svg.remove();
      options.divid = "stack";
      console.log(gameEngineTmp.renderColumn(row, col));
      render(gameEngineTmp.renderColumn(row, col), options);
    }

    if (boardImage.current !== undefined) {
      const svg = boardImage.current.querySelector('svg');
      if (svg !== null) {
        svg.remove();
      }
      if (renderrep !== null && settings !== null) {
        console.log("renderrep", renderrep);
        options = {"divid": "svg"};
        if (focus.moveNumber === explorationRef.current.length - 1) {
          options.boardClick = boardClick;
        }
        options.rotate = settings.rotate;
        if (settings.color === "blind") {
          options.colourBlind = true;
        } else if (settings.color === "patterns") {
          options.patterns = true;
        }
        if (gameRef.current.stackExpanding) {
          options.boardHover = (row, col, piece) => { console.log("gm", row, col);expand(col, row); };
        }
        options.showAnnotations = settings.annotate;
        console.log(renderrep);
        console.log("options = ", options);
        render(renderrep, options);
      }
    } else {
      waiter();
    }
  }, [renderrep, focus, settings, wait, moveSetter, renderrepSetter]);

  useEffect(() => {
    if (gameRef.current !== null) {
      var newSettings = {};
      const game = gameRef.current;
      newSettings.color = getSetting("color", "standard", gameSettings, userSettings, game.metaGame);
      newSettings.annotate = getSetting("annotate", true, gameSettings, userSettings, game.metaGame);
      newSettings.rotate = (gameSettings === undefined || gameSettings.rotate === undefined) ? 0 : gameSettings.rotate;
      setupColors(newSettings, game, t);
      settingsSetter(newSettings);
    }
  }, [gameSettings, userSettings, settingsSetter, t]);

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

  const handleUpdateRenderOptions = () => {
      showSettingsSetter(true);
  }

  const handleRotate = async () => {
    let newGameSettings = cloneDeep(gameSettings);
    if (newGameSettings === undefined) newGameSettings = {};
    let rotate = newGameSettings.rotate;
    if (rotate === undefined) rotate = 0;
    rotate = (rotate === 0) ? 180 : 0;
    newGameSettings.rotate = rotate;
    gameSettingsSetter(newGameSettings);
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
          "query": "update_game_settings",
          "pars" : {
            "game": game.id,
            "settings": newGameSettings
          }})
        });
    }
    catch (error) {
      setError(error);
    }
  }

  const handleSettingsClose = () => {
    showSettingsSetter(false);
  }

  const handleSettingsSave = () => {
    showSettingsSetter(false);
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
      setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, statusRef, movesRef, focusSetter, explorationRef, t);
      setupColors(settings, gameRef.current, t);
      focusSetter({"moveNumber": explorationRef.current.length - 1, "exPath": []});
    }
    catch (err) {
      setError(err.message);
    }
  }

  const handleResign = () => {
    showResignConfirmSetter(true);
  }

  const handleCloseResignConfirm = () => {
    showResignConfirmSetter(false);
  }

  const handleResignConfirmed = async () => {
    showResignConfirmSetter(false);
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
            "move": "resign"
          }
        })
      });
      const result = await res.json();
      if (result.statusCode !== 200)
        setError(JSON.parse(result.body));
      let game0 = JSON.parse(result.body);
      console.log("In handleSubmit. game0:");
      console.log(game0);
      setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, statusRef, movesRef, focusSetter, explorationRef, t);
      setupColors(settings, gameRef.current, t);
      focusSetter({"moveNumber": explorationRef.current.length - 1, "exPath": []});
    }
    catch (err) {
      setError(err.message);
    }
  }

  function keyDownHandler(e) {
    const key = e.key;
    if (document.activeElement.id === "enterAMove" || explorationRef.current === null)
      return;
    let path = [];
    let curNumVariations;

    switch (key) {
      case "Home":
      case "h":
        handleGameMoveClick({"moveNumber": 0, "exPath": []});
        e.preventDefault();
        break;
      case "ArrowLeft":
      case "j":
        getPath(focus, explorationRef.current, path);
        if (focus.moveNumber + focus.exPath.length > 0)
          handleGameMoveClick(focus.moveNumber + focus.exPath.length === 1 ? {"moveNumber": 0, "exPath": []} : path[focus.moveNumber + focus.exPath.length - 2][0]);
        e.preventDefault();
        break;
      case "ArrowRight":
      case "k":
        getPath(focus, explorationRef.current, path);
        if (focus.moveNumber + focus.exPath.length < path.length)
          handleGameMoveClick(path[focus.moveNumber + focus.exPath.length][0]);
        e.preventDefault();
        break;
      case "End":
      case "l":
        getPath(focus, explorationRef.current, path);
        if (focus.moveNumber + focus.exPath.length !== exploration.length - 1)
          handleGameMoveClick(exploration.length === 1 ? {"moveNumber": 0, "exPath": []} : path[exploration.length - 2][0]);
        e.preventDefault();
        break;
      case "ArrowDown":
      case "i":
        curNumVariations = getPath(focus, explorationRef.current, path);
        console.log(curNumVariations);
        console.log("focus = ", focus);
        if (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1)
          handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + 1) % curNumVariations]});
        e.preventDefault();
        break;
      case "ArrowUp":
      case "m":
        curNumVariations = getPath(focus, explorationRef.current, path);
        if (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1)
          handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + curNumVariations - 1) % curNumVariations]});
        e.preventDefault();
        break;
      default:
        console.log(key + ' key pressed');
    }
  }

  useEventListener('keydown', keyDownHandler);

  const boardImage = useRef();
  const stackImage = useRef();
  const game = gameRef.current;
  const exploration = explorationRef.current;
  console.log("rendering at focus ", focus);
  if (!error) {
    if (focus !== null) {
      // Prepare header
      const simul = game.simultaneous;
      let numcolumns = simul ? 1 : game.numPlayers;
      let header = [];
      for (let i = 0; i < numcolumns; i++) {
        let player = game.players[i].name;
        let img = null;
        if (game.colors !== undefined) img = game.colors[i];
        header.push(
          <th colSpan="2" key={"th-" + i}>
            <div className="player">
              { img === null ? '' :
                img.isImage ?
                    <img className="toMoveImage" src={`data:image/svg+xml;utf8,${encodeURIComponent(img.value)}`} alt="" />
                  : <span className="playerIndicator">{img.value + ':'}</span>
              }
              <span className="mover">{player}</span>
            </div>
          </th>
        );
      }
      // Prepare the list of moves
      let moveRows = [];
      let path = [];
      let curNumVariations = 0;

      if (exploration !== null) {
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
            curNumVariations = node.children.length;
            node = node.children[focus.exPath[j]];
            if (node.outcome === 0)
              className += " gameMoveUnknownOutcome";
            else if (node.outcome === -1)
              className += " gameMoveLoss";
            else if (node.outcome === 1)
              className += " gameMoveWin";
            path.push([{"class": className, "move": node.move, "path": {"moveNumber": focus.moveNumber, "exPath": focus.exPath.slice(0, j + 1)}}]);
          }
          while (node.children.length > 0) {
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
            if (node.children.length !== 1)
              break;
            node = node.children[0];
          }
        }
        for (let i = 0; i < Math.ceil(path.length / numcolumns); i++) {
          let row = [];
          for (let j = 0; j < numcolumns; j++) {
            let clName = j === 0 ? "gameMoveLeftCol" : "gameMoveMiddleCol";
            let movenum = numcolumns * i + j;
            row.push(<td key={'td0-'+i+'-'+j} className={clName}>{movenum >= path.length ? '' : (movenum+1) + '.'}</td>);
            if (movenum < path.length) {
              row.push(
                <td key={'td1-'+i+'-'+j}>
                  <div className="move">
                    { path[movenum].map((m, k) =>
                      <span key={"move" + i + "-" + j + "-" + k}>{k > 0 ? ", ": ""}
                        <span className={m.class} onClick={() => handleGameMoveClick(m.path)}>
                          {m.move}
                        </span>
                      </span>)
                    }
                  </div>
                </td>);
            }
            else {
              row.push(<td key={'td1-'+i+'-'+j}></td>);
            }
          }
          moveRows.push(row);
        }
      }

      console.log("path", path);
      /*
      console.log(path);
      console.log("focus");
      console.log(focus);
      console.log(curNumVariations);
      */
      console.log(explorationRef.current);
      return (
        <div className="main">
          <nav>
            <a href="#">{t('About')}</a>
          </nav>
          <article>
            <div className="article">
              <div className="gameMoveContainer">
                <div className="enterMoveContainer">
                  <div className="enterMoveContainer2">
                    <div className="groupLevel1Header"><span>{t("MakeMove")}</span></div>
                      <GameStatus status={statusRef.current} game={game}/>
                      <MoveEntry move={move} toMove={getFocusNode(explorationRef.current, focus).toMove} game={gameRef.current} moves={movesRef.current} exploration={explorationRef.current}
                        focus={focus} handlers={[handleMove, handleMarkAsWin, handleMarkAsLoss, handleSubmit, handleView, handleResign]}/>
                    </div>
                  </div>
                <div className="boardContainer">
                  <div className="groupLevel1Header"><span>{game.name}</span></div>
                  {gameRef.current.stackExpanding
                    ? <div className="board"><div className="stack" id="stack" ref={stackImage} ></div><div className="stackboard" id="svg" ref={boardImage}></div></div>
                    : <div className="board" id="svg" ref={boardImage} style={{width: "100%"}}></div>
                  }
                  <div className="boardButtons">
                    <button className="fabtn align-right" onClick={handleRotate}>
                      <i className="fa fa-refresh"></i>
                    </button>
                    <button className="fabtn align-right" onClick={handleUpdateRenderOptions}>
                      <i className="fa fa-cog"></i>
                    </button>
                  </div>
                </div>
                <div className="gameMovesContainer">
                  <div className="gameMovesContainer2">
                    <div className="groupLevel1Header"><span>{t("Moves")}</span></div>
                      <div className="moveButtons">
                        <div className="famnav tooltipped" onClick={() => handleGameMoveClick({"moveNumber": 0, "exPath": []})}>
                          <i className="fa fa-angle-double-left"></i>
                          <span className="tooltiptext">{t('GoBegin')}</span>
                        </div>
                        <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length > 0 ? "" : " disabled")} onClick={
                            focus.moveNumber + focus.exPath.length > 0 ? () => handleGameMoveClick(focus.moveNumber + focus.exPath.length === 1 ? {"moveNumber": 0, "exPath": []} :
                              path[focus.moveNumber + focus.exPath.length - 2][0].path) : undefined }>
                          <i className="fa fa-angle-left"></i>
                          <span className="tooltiptext">{t('GoPrev')}</span>
                        </div>
                        <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1 ? "" : " disabled")} onClick={
                          focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 ?
                            () => handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + 1) % curNumVariations]}) : undefined }>
                          <i className="fa fa-angle-up"></i>
                          <span className="tooltiptext">{t('GoNextVar')}</span>
                        </div>
                        <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 && curNumVariations !== 1 ? "" : " disabled")} onClick={
                          focus.moveNumber + focus.exPath.length <= path.length && focus.exPath.length > 0 ?
                            () => handleGameMoveClick({"moveNumber": focus.moveNumber, "exPath": [...focus.exPath.slice(0,-1), (focus.exPath[focus.exPath.length - 1] + curNumVariations - 1) % curNumVariations]}) : undefined }>
                          <i className="fa fa-angle-down"></i>
                          <span className="tooltiptext">{t('GoPrevVar')}</span>
                        </div>
                        <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length < path.length ? "" : " disabled")} onClick={
                          focus.moveNumber + focus.exPath.length < path.length ? () => handleGameMoveClick(path[focus.moveNumber + focus.exPath.length][0].path) : undefined }>
                          <i className="fa fa-angle-right"></i>
                          <span className="tooltiptext">{t('GoNext')}</span>
                        </div>
                        <div className={"famnav tooltipped" + (focus.moveNumber + focus.exPath.length !== exploration.length - 1 ? "" : " disabled")} 
                          onClick={() => handleGameMoveClick(exploration.length === 1 ? {"moveNumber": 0, "exPath": []} : path[exploration.length - 2][0].path)}>
                          <i className="fa fa-angle-double-right"></i>
                          <span className="tooltiptext">{t('GoCurrent')}</span>
                        </div>
                      </div>
                      <table className="movesTable">
                        <tbody>
                          <tr>{header}</tr>
                          { moveRows.map((row, index) =>
                            <tr key={"move" + index}>
                              { row }
                            </tr>)
                          }
                        </tbody>
                      </table>
                  </div>
                </div>
                <RenderOptionsModal show={showSettings} metaGame={{"id":game.metaGame, "name": game.name}} gameId={game.id} settings={userSettings} gameSettings={gameSettings}
                  settingsSetter={userSettingsSetter} gameSettingsSetter={gameSettingsSetter} showSettingsSetter={showSettingsSetter} setError={setError}
                  handleClose={handleSettingsClose} handleSave={handleSettingsSave} />
              </div>
              <div className="moveResultsContainer">
                <div className="moveResultsContainer2">
                  <div className="groupLevel1Header"><span>Game summary</span></div>
                  <MoveResults className="moveResults" results={game.moveResults}/>
                </div>
              </div>
              <Modal show={showResignConfirm} title={t('ConfirmResign')} size="small"
                buttons={[{label: t('Resign'), action: handleResignConfirmed}, {label: t('Cancel'), action: handleCloseResignConfirm}]}>
                <div>
                  Are you sure you want to resign?
                </div>
              </Modal>
            </div>
          </article>
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
