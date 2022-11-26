import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { render, renderglyph } from '@abstractplay/renderer';
import { Auth } from 'aws-amplify';
import { cloneDeep } from 'lodash';
import { API_ENDPOINT_AUTH } from '../config';
import { GameNode } from './GameTree';
import { gameinfo, GameFactory, addResource } from '@abstractplay/gameslib';
import GameMoves from './GameMoves';
import GameStatus from './GameStatus';
import MoveEntry from './MoveEntry';
import MoveResults from './MoveResults';
import RenderOptionsModal from './RenderOptionsModal';
import Modal from './Modal';
import GameComment from './GameComment';
import { Link } from "react-router-dom";

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

function setStatus(engine, game, isPartial, partialMove, status) {
  status.statuses = engine.statuses(isPartial, partialMove);
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
      const stash = engine.getPlayerStash(i);
      status.stashes.push(stash);
    }
  }
  if (game.sharedStash) {
    status.sharedstash = engine.getSharedStash(isPartial, partialMove);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, statusRef, movesRef, focusSetter, explorationRef, moveSetter) {
  const info = gameinfo.get(game0.metaGame);
  game0.name = info.name;
  game0.simultaneous = (info.flags !== undefined && info.flags.includes('simultaneous'));
  game0.sharedPieces = (info.flags !== undefined && info.flags.includes('shared-pieces'));
  game0.perspective = (info.flags !== undefined && info.flags.includes('perspective'));
  game0.rotate90 = (info.flags !== undefined && info.flags.includes('rotate90'));
  game0.scores = (info.flags !== undefined && info.flags.includes('scores'));
  game0.limitedPieces = (info.flags !== undefined && info.flags.includes('limited-pieces'));
  game0.playerStashes = (info.flags !== undefined && info.flags.includes('player-stashes'));
  game0.sharedStash = (info.flags !== undefined && info.flags.includes('shared-stash'));
  game0.noMoves = (info.flags !== undefined && info.flags.includes('no-moves'));
  game0.stackExpanding = (info.flags !== undefined && info.flags.includes('stacking-expanding'));
  if (game0.state === undefined)
    throw new Error("Why no state? This shouldn't happen no more!");
  const engine = GameFactory(game0.metaGame, game0.state);
  moveSetter({...engine.validateMove(''), "previous": '', "move": ''});
  game0.me = game0.players.findIndex(p => p.id === state.myid);
  if (game0.simultaneous) {
    game0.canSubmit = (game0.toMove === "" || game0.me < 0) ? false : game0.toMove[game0.me];
    if (game0.toMove !== "") {
      if (game0.partialMove !== undefined && game0.partialMove.length > game0.numPlayers - 1) // the empty move is numPlayers - 1 commas
        engine.move(game0.partialMove, true);
    }
    game0.canExplore = false;
  }
  else {
    game0.canSubmit = (game0.toMove !== "" && game0.players[game0.toMove].id === state.myid);
    game0.canExplore = game0.toMove !== "" && game0.numPlayers === 2;
  }
  if (game0.sharedPieces) {
    game0.seatNames = [];
    if (typeof engine.player2seat === "function") {
      for (let i = 1; i <= game0.numPlayers; i++) {
        game0.seatNames.push(engine.player2seat(i));
      }
    } else {
      for (let i = 1; i <= game0.numPlayers; i++) {
        game0.seatNames.push("Player" + i.toString());
      }
    }
  }
  if (typeof engine.chatLog === "function") {
    game0.moveResults = engine.chatLog(game0.players.map(p => p.name)).reverse().map((e) => {return {"time": e[0], "log": e.slice(1).join(" ")};});
  } else {
    game0.moveResults = engine.resultsHistory().reverse();
  }
  if (gameRef.current !== null && gameRef.current.colors !== undefined)
    game0.colors = gameRef.current.colors; // gets used when you submit a move.
  gameRef.current = game0;
  partialMoveRenderRef.current = false;
  const render = engine.render(game0.me + 1);
  setStatus(engine, game0, game0.simultaneous && !game0.canSubmit, '', statusRef.current);
  if (!game0.noMoves && (game0.canSubmit || (!game0.simultaneous && game0.numPlayers === 2))) {
    if (game0.simultaneous)
      movesRef.current = engine.moves(game0.me + 1);
    else
      movesRef.current = engine.moves();
  }
  let history = [];
  /*eslint-disable no-constant-condition*/
  let gameOver = engine.gameover;
  /*
  // if this is a simultaneous game, and I've submitted my move but not everyone else has, the partialMove won't be on the stack. So update history without popping the stack.
  if (game0.simultaneous && game0.toMove !== "" && game0.partialMove !== undefined && game0.partialMove.length > 0) {
    history.unshift(new GameNode(null, engine.lastmove, engine.serialize(), gameOver ? '' : engine.currplayer - 1));
    engine.load();
  }
  */
  while (true) {
    // maybe last move should be the last numPlayers moves for simul games?
    /*
    let lastmove = null;
    if (Array.isArray(engine.stack[engine.stack.length - 1].lastmove))
      lastmove = engine.stack[engine.stack.length - 1].lastmove.join(', ');
    else
      lastmove = engine.stack[engine.stack.length - 1].lastmove;
    history.unshift(new GameNode(null, lastmove, engine.serialize(), engine.stack[engine.stack.length - 1].gameover ? '' : engine.stack[engine.stack.length - 1].currplayer - 1));
    */
    history.unshift(new GameNode(null, engine.lastmove, engine.serialize(), gameOver ? '' : engine.currplayer - 1));
    engine.stack.pop();
    gameOver = false;
    if (engine.stack.length === 0)
      break;
    engine.load();
  }
  explorationRef.current = history;
  let focus0 = {"moveNumber": history.length - 1, "exPath": []};
  focus0.canExplore = canExploreMove(gameRef.current, explorationRef.current, focus0);
  focusSetter(focus0);
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
      return {"isImage": false, "value": game.seatNames[i]}
    } else {
      options.svgid = 'player' + i + 'color';
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
  setStatus(gameEngineTmp, game, partialMove || simMove, move, statusRef.current);
  if (!partialMove) {
    node = getFocusNode(explorationRef.current, focus);
    let newstate = gameEngineTmp.serialize();
    console.log("newstate", newstate);
    const pos = node.AddChild(move.move, newstate, (node.toMove + 1) % game.players.length);
    let newfocus = cloneDeep(focus);
    newfocus.exPath.push(pos);
    newfocus.canExplore = canExploreMove(game, explorationRef.current, newfocus);
    focusSetter(newfocus);
    moveSetter({...gameEngineTmp.validateMove(''), "previous": '', "move": ''});
    if (newfocus.canExplore && !game.noMoves)
      movesRef.current = gameEngineTmp.moves();
  }
  partialMoveRenderRef.current = partialMove;
  console.log('setting renderrep 1');
  renderrepSetter(gameEngineTmp.render(game.me + 1));
}

function getFocusNode(exp, foc) {
  let curNode = exp[foc.moveNumber];
  for (const p of foc.exPath) {
    curNode = curNode.children[p];
  }
  return curNode;
}

function canExploreMove(game, exploration, focus) {
  return (game.canExplore || (game.canSubmit && focus.exPath.length === 0)) // exploring (beyond move input) is supported or it is my move and we are just looking at the current position
    && exploration !== null 
    && focus.moveNumber === exploration.length - 1;    // we aren't looking at history
}

function GameMove(props) {
  const [renderrep, renderrepSetter] = useState(null);
  // What place in the tree the display is currently showing. If history, just the move number. If exploration, the move from which we are exploring and then the path through the tree.
  const [focus, focusSetter] = useState(null);
  const [move, moveSetter] = useState({"move": '', "valid": true, "message": '', "complete": 0, "previous": ''});
  const [error, errorSetter] = useState(false);
  const [showSettings, showSettingsSetter] = useState(false);
  const [showResignConfirm, showResignConfirmSetter] = useState(false);
  const [showTimeoutConfirm, showTimeoutConfirmSetter] = useState(false);
  const [userSettings, userSettingsSetter] = useState();
  const [gameSettings, gameSettingsSetter] = useState();
  const [settings, settingsSetter] = useState(null);
  const [wait, waitSetter] = useState(0);
  const [comments, commentsSetter] = useState([]);
  const [submitting, submittingSetter] = useState(false);
  const errorMessageRef = useRef("");
  const movesRef = useRef(null);
  const statusRef = useRef({});
  // whether user has entered a partial move that can be rendered
  const partialMoveRenderRef = useRef(false);
  const focusRef = useRef();
  focusRef.current = focus;
  const moveRef = useRef();
  moveRef.current = move;
  const boardImage = useRef();
  const stackImage = useRef();
  const gameRef = useRef(null);
  // Game tree of explored moves at each history move. For games that are not complete, only at the last move.
  const explorationRef = useRef(null);

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
          let data = JSON.parse(result.body);
          console.log(data.game);
          setupGame(data.game, gameRef, state, partialMoveRenderRef, renderrepSetter, statusRef, movesRef, focusSetter, explorationRef, moveSetter);
          userSettingsSetter(state.settings);
          gameSettingsSetter(data.game.players.find(p => p.id === state.myid).settings);
          if (data.comments !== undefined)
            commentsSetter(data.comments);
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

  // when the user clicks on the list of moves (or move list navigation)
  const handleGameMoveClick = (foc) => {
    console.log("foc = ", foc);
    let node = getFocusNode(explorationRef.current, foc);
    let engine = GameFactory(game.metaGame, node.state);
    partialMoveRenderRef.current = false;
    foc.canExplore = canExploreMove(game, explorationRef.current, foc);
    if (foc.canExplore && !game.noMoves) {
      movesRef.current = engine.moves();
    }
    focusSetter(foc);
    renderrepSetter(engine.render(gameRef.current.me + 1));
    const isPartialSimMove = gameRef.current.simultaneous 
      && (foc.exPath.length === 1 || (foc.exPath.length === 0 && foc.moveNumber === explorationRef.current.length - 1 && !gameRef.current.canSubmit))
    setStatus(engine, gameRef.current, isPartialSimMove, '', statusRef.current);
    moveSetter({...engine.validateMove(''), "move": '', "previous": ''});
  }
  
  const handleMove = (value) => {
    let node = getFocusNode(explorationRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    let result;
    if (gameRef.current.simultaneous)
      result = gameEngineTmp.validateMove(value, gameRef.current.me + 1);
    else
      result = gameEngineTmp.validateMove(value);
    result.move = value;
    result.previous = move.move;
    console.log(result);
    moveSetter(result);
  }
     
  const handleView = () => {
    const newmove = cloneDeep(move);
    newmove.complete = 1;
    moveSetter(newmove);
  }

  const handleStashClick = (player, count, movePart) => {
    console.log(`handleStashClick movePArt=${movePart}`);
    handleMove(move.move + movePart);
  }

  useEffect(() => {
    console.log('in useEffect for [state, move, focus]');
    console.log(move);
    // if the move is complete, or partial and renderable, update board
    if ((move.valid && move.complete > 0 && move.move !== '') || (move.canrender === true)) {
      doView(state, gameRef.current, move, explorationRef, focus, errorMessageRef, errorSetter, focusSetter, moveSetter,
        partialMoveRenderRef, renderrepSetter, movesRef, statusRef);
    }
    // if the user is starting a new move attempt, it isn't yet renderable and the current render is for a partial move, go back to showing the current position
    else if (partialMoveRenderRef.current && !move.move.startsWith(move.previous)) {
      let node = getFocusNode(explorationRef.current, focus);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      partialMoveRenderRef.current = false;
      setStatus(gameEngineTmp, gameRef.current, false, '', statusRef.current);
      if (focus.canExplore && !gameRef.current.noMoves)
        movesRef.current = gameEngineTmp.moves();
      renderrepSetter(gameEngineTmp.render(gameRef.current.me + 1));
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
      console.log(`boardClick:(${row},${col},${piece})`);
      let node = getFocusNode(explorationRef.current, focusRef.current);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      let result = gameRef.current.simultaneous ? 
        gameEngineTmp.handleClickSimultaneous(moveRef.current.move, row, col, gameRef.current.me + 1, piece) 
        : gameEngineTmp.handleClick(moveRef.current.move, row, col, piece);
      result.previous = moveRef.current.move;
      console.log('move', moveRef.current.move);
      console.log('result',result);
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
        console.log("focus.moveNumber", focus.moveNumber, "explorationRef.current.length", explorationRef.current.length);
        if (focus.canExplore) {
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
        options.svgid = 'theBoardSVG';
        console.log(renderrep);
        console.log("options = ", options);
        render(renderrep, options);
      }
    } else {
      waiter();
    }
  }, [renderrep, focus, settings, wait, moveSetter, renderrepSetter]);

  useEffect(() => {
    console.log('In useEffect for [gameSettings, userSettings, settingsSetter, t]');
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
    rotate += gameRef.current.rotate90 && gameRef.current.numPlayers > 2 ? 90 : 180;
    if (rotate >= 360)
      rotate -= 360;
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

  const handleSubmit = async (draw) => {
    submittingSetter(true);
    if (draw === "drawaccepted") {
      submitMove("", draw);  
    } else {
      let m = getFocusNode(explorationRef.current, focus).move;
      submitMove(m, draw);
    }
  }

  const submitMove = async (m, draw) => {  
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
            "move": m,
            "draw": draw
          }
        })
      });
      const result = await res.json();
      submittingSetter(false);
      if (result.statusCode !== 200)
        setError(JSON.parse(result.body));
      let game0 = JSON.parse(result.body);
      console.log("In handleSubmit. game0:");
      console.log(game0);
      setupGame(game0, gameRef, state, partialMoveRenderRef, renderrepSetter, statusRef, movesRef, focusSetter, explorationRef, moveSetter);
      // setupColors(settings, gameRef.current, t);
    }
    catch (err) {
      setError(err.message);
    }
  }

  const submitComment = async (comment) => {
    commentsSetter([...comments, {"comment": comment, "userId": state.myid, "timeStamp": Date.now()}]);
    console.log(comments);
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
          "query": "submit_comment",
          "pars" : {
            "id": gameRef.current.id,
            "comment": comment,
            "moveNumber": explorationRef.current.length - 1
          }
        })
      });
      const result = await res.json();
      if (result && result.statusCode && result.statusCode !== 200)
        setError(JSON.parse(result.body));
    }
    catch (err) {
      console.log(err);
      //setError(err.message);
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
    submittingSetter(true);
    submitMove('resign', false);
  }

  const handleTimeout = () => {
    showTimeoutConfirmSetter(true);
  }

  const handleCloseTimeoutConfirm = () => {
    showTimeoutConfirmSetter(false);
  }

  const handleTimeoutConfirmed = async () => {
    showTimeoutConfirmSetter(false);
    submittingSetter(true);
    submitMove('timeout', false);
  }

  const game = gameRef.current;
  console.log("rendering at focus ", focus);
  if (!error) {
    console.log(explorationRef.current);
    return (
      <div className="main">
        <nav>
          <div><Link to="/about">{t('About')}</Link></div>
          <div><Link to="/games">{t('Games')}</Link></div>
          <div><Link to="/">{t('MyDashboard')}</Link></div>
        </nav>
        <article>
          <div className="article">
            <div className="gameMoveContainer">
              <div className="enterMoveContainer">
                <div className="enterMoveContainer2">
                  { /***************** MoveEntry *****************/}
                  <div className="groupLevel1Header"><span>{t("MakeMove")}</span></div>
                    <GameStatus status={statusRef.current} settings={settings} game={game} canExplore={focus?.canExplore} handleStashClick={handleStashClick} />
                    <MoveEntry move={move} toMove={focus ? getFocusNode(explorationRef.current, focus).toMove : ''} game={gameRef.current} moves={movesRef.current} exploration={explorationRef.current}
                      focus={focus} submitting={submitting} handlers={[handleMove, handleMarkAsWin, handleMarkAsLoss, handleSubmit, handleView, handleResign, handleTimeout]}/>
                  </div>
                </div>
              <div className="boardContainer">
                { /***************** Board *****************/}
                <div className="groupLevel1Header"><span>{state.metaGame}</span></div>
                {gameRef.current?.stackExpanding
                  ? <div className="board"><div className="stack" id="stack" ref={stackImage} ></div><div className="stackboard" id="svg" ref={boardImage}></div></div>
                  : <div className="board" id="svg" ref={boardImage} ></div>
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
                { /***************** GameMoves *****************/}
                <GameMoves focus={focus} game={game} exploration={explorationRef.current} handleGameMoveClick={handleGameMoveClick} />
              </div>
              <RenderOptionsModal show={showSettings} metaGame={{"id":game?.metaGame, "name": game?.name}} gameId={game?.id} settings={userSettings} gameSettings={gameSettings}
                settingsSetter={userSettingsSetter} gameSettingsSetter={gameSettingsSetter} showSettingsSetter={showSettingsSetter} setError={setError}
                handleClose={handleSettingsClose} handleSave={handleSettingsSave} />
            </div>
            <div className="commentContainer">
              <div className="commentContainer2">
                { /***************** GameComment *****************/}
                <GameComment className="gameComment" handleSubmit={submitComment} />
              </div>
            </div>
            <div className="moveResultsContainer">
              <div className="moveResultsContainer2">
                { /***************** MoveResults *****************/}
                <div className="groupLevel1Header"><span>Game summary</span></div>
                <MoveResults className="moveResults" results={game?.moveResults} comments={comments} players={gameRef.current?.players} />
              </div>
            </div>
            <Modal show={showResignConfirm} title={t('ConfirmResign')} size="small"
              buttons={[{label: t('Resign'), action: handleResignConfirmed}, {label: t('Cancel'), action: handleCloseResignConfirm}]}>
              <div>
                {t('ConfirmResignDesc')}
              </div>
            </Modal>
            <Modal show={showTimeoutConfirm} title={t('ConfirmTimeout')} size="small"
              buttons={[{label: t('Claim'), action: handleTimeoutConfirmed}, {label: t('Cancel'), action: handleCloseTimeoutConfirm}]}>
              <div>
              {t('ConfirmTimeoutDesc')}
              </div>
            </Modal>
          </div>
        </article>
      </div>
    );
  }
  else {
    return (<h4>{errorMessageRef.current}</h4>);
  }
}

export default GameMove;
