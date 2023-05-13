import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useContext,
  createContext,
} from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { render, renderglyph } from "@abstractplay/renderer";
import { Auth } from "aws-amplify";
import { cloneDeep } from "lodash";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { GameNode } from "./GameTree";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import { Buffer } from "buffer";
import GameMoves from "./GameMoves";
import GameStatus from "./GameStatus";
import MoveEntry from "./MoveEntry";
import MoveResults from "./MoveResults";
import RenderOptionsModal from "./RenderOptionsModal";
import Modal from "./Modal";
import GameComment from "./GameComment";
import ClipboardCopy from "./ClipboardCopy";
import { MeContext, MyTurnContext } from "../pages/Skeleton";
import NewChatMarker from "./NewChatMarker";
import DownloadDataUri from "./DownloadDataUri";

export const NewChatContext = createContext([false, () => false]);

function getSetting(setting, deflt, gameSettings, userSettings, metaGame) {
  if (gameSettings !== undefined && gameSettings[setting] !== undefined) {
    return gameSettings[setting];
  } else if (userSettings !== undefined) {
    if (
      userSettings[metaGame] !== undefined &&
      userSettings[metaGame][setting] !== undefined
    ) {
      return userSettings[metaGame][setting];
    } else if (
      userSettings.all !== undefined &&
      userSettings.all[setting] !== undefined
    ) {
      return userSettings.all[setting];
    } else {
      return deflt;
    }
  } else {
    return deflt;
  }
}

function setStatus(engine, game, isPartial, partialMove, status) {
  status.statuses = engine.statuses(isPartial, partialMove);
  if (game.scores) {
    status.scores = engine.getPlayersScores();
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
  // console.log("setStatus, status:", status);
}

// Whether the user wants to explore
function isExplorer(explorer, me) {
  return (
    me?.settings?.all?.exploration === 1 ||
    ((!me ||
      !me.settings ||
      !me.settings.all ||
      me.settings.all.exploration === 0) &&
      explorer)
  );
}

function setupGame(
  game0,
  gameRef,
  me,
  explorer,
  partialMoveRenderRef,
  renderrepSetter,
  statusRef,
  movesRef,
  focusSetter,
  explorationRef,
  moveSetter,
  gameRecSetter
) {
  const info = gameinfo.get(game0.metaGame);
  game0.name = info.name;
  game0.simultaneous =
    info.flags !== undefined && info.flags.includes("simultaneous");
  game0.sharedPieces =
    info.flags !== undefined && info.flags.includes("shared-pieces");
  game0.rotate90 = info.flags !== undefined && info.flags.includes("rotate90");
  game0.scores = info.flags !== undefined && info.flags.includes("scores");
  game0.limitedPieces =
    info.flags !== undefined && info.flags.includes("limited-pieces");
  game0.playerStashes =
    info.flags !== undefined && info.flags.includes("player-stashes");
  game0.sharedStash =
    info.flags !== undefined && info.flags.includes("shared-stash");
  game0.noMoves = (info.flags !== undefined && info.flags.includes("no-moves")) || (game0.metaGame === "homeworlds");
  game0.stackExpanding =
    info.flags !== undefined && info.flags.includes("stacking-expanding");
  if (game0.state === undefined)
    throw new Error("Why no state? This shouldn't happen no more!");
  const engine = GameFactory(game0.metaGame, game0.state);
  moveSetter({ ...engine.validateMove(""), previous: "", move: "" });
  game0.me = game0.players.findIndex((p) => me && p.id === me.id);
  game0.variants = engine.getVariants();
  if (game0.simultaneous) {
    game0.canSubmit =
      game0.toMove === "" || game0.me < 0 ? false : game0.toMove[game0.me];
    if (game0.toMove !== "") {
      if (
        game0.partialMove !== undefined &&
        game0.partialMove.length > game0.numPlayers - 1
      )
        // the empty move is numPlayers - 1 commas
        engine.move(game0.partialMove, true);
    }
    game0.canExplore = false;
  } else {
    game0.canSubmit =
      game0.toMove !== "" && me && game0.players[game0.toMove].id === me.id;
    game0.canExplore =
      game0.toMove !== "" && game0.numPlayers === 2 && isExplorer(explorer, me);
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
    game0.moveResults = engine
      .chatLog(game0.players.map((p) => p.name))
      .reverse()
      .map((e) => {
        return { time: e[0], log: e.slice(1).join(" ") };
      });
  } else {
    game0.moveResults = engine.resultsHistory().reverse();
  }
  if (gameRef.current !== null && gameRef.current.colors !== undefined)
    game0.colors = gameRef.current.colors; // gets used when you submit a move.
  gameRef.current = game0;
  partialMoveRenderRef.current = false;
  const render = engine.render(game0.me + 1);
  setStatus(
    engine,
    game0,
    game0.simultaneous && !game0.canSubmit,
    "",
    statusRef.current
  );
  if (
    !game0.noMoves &&
    (game0.canSubmit || (!game0.simultaneous && game0.numPlayers === 2))
  ) {
    if (game0.simultaneous) movesRef.current = engine.moves(game0.me + 1);
    else movesRef.current = engine.moves();
  }

  // If the game is over, generate the game record
  // TODO: Add "event" and "round" should those ever be implemented.
  if (engine.gameover && engine.stack.length >= 2) {
    gameRecSetter(
      engine.genRecord({
        uid: game0.id,
        players: game0.players.map((p) => {
          return {
            name: p.name,
            uid: p.id,
          };
        }),
        dateStart: new Date(engine.stack[0]._timestamp),
        dateEnd: new Date(engine.stack[engine.stack.length - 1]._timestamp),
        unrated: !game0.rated,
      })
    );
  }

  let history = [];
  // The following is DESTRUCTIVE! If you need `engine.stack`, do it before here.
  /*eslint-disable no-constant-condition*/
  let gameOver = engine.gameover;
  while (true) {
    history.unshift(
      new GameNode(
        null,
        engine.lastmove,
        engine.serialize(),
        gameOver ? "" : engine.currplayer - 1
      )
    );
    engine.stack.pop();
    gameOver = false;
    if (engine.stack.length === 0) break;
    engine.load();
  }
  explorationRef.current = history;
  let focus0 = { moveNumber: history.length - 1, exPath: [] };
  focus0.canExplore = canExploreMove(
    gameRef.current,
    explorationRef.current,
    focus0
  );
  focusSetter(focus0);
  // console.log("Setting renderrep");
  renderrepSetter(render);
}

function mergeExploration(game, exploration, data) {
  const moveNumber = exploration.length;
  if (data[0] && data[0].move === moveNumber) {
    let node = exploration[moveNumber - 1];
    let gameEngine = GameFactory(game.metaGame, node.state);
    mergeMoveRecursive(gameEngine, node, data[0].tree);
  } else if (data[1] && data[1].move === moveNumber - 2) {
    let node = exploration[moveNumber - 2];
    let gameEngine = GameFactory(game.metaGame, node.state);
    console.log("data[1]: ", data[1]);
    const subtree1 = data[1].tree.find((e) =>
      gameEngine.sameMove(exploration[moveNumber - 2].move, e.move)
    );
    if (subtree1) {
      gameEngine.move(exploration[moveNumber - 1].move);
      const subtree2 = subtree1.children.find((e) =>
        gameEngine.sameMove(exploration[moveNumber - 1].move, e.move)
      );
      if (subtree2) {
        mergeMoveRecursive(
          gameEngine,
          exploration[moveNumber - 1],
          subtree2.children
        );
      }
    }
  }
}

function mergeMoveRecursive(gameEngine, node, children) {
  console.log(node);
  children.forEach((n) => {
    gameEngine.move(n.move);
    const pos = node.AddChild(
      n.move,
      gameEngine.serialize(),
      gameEngine.gameover ? "" : gameEngine.currplayer - 1,
      gameEngine
    );
    if (n.outcome !== undefined) node.children[pos].SetOutcome(n.outcome);
    mergeMoveRecursive(gameEngine, node.children[pos], n.children);
    gameEngine.stack.pop();
    gameEngine.load();
  });
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
      return { isImage: false, value: game.seatNames[i] };
    } else {
      options.svgid = "player" + i + "color";
      return {
        isImage: true,
        value: renderglyph("piece", i + 1, options),
      };
    }
  });
}

async function saveExploration(exploration, gameid, me, explorer) {
  if (!isExplorer(explorer, me)) return;
  const usr = await Auth.currentAuthenticatedUser();
  console.log("gameid", gameid);
  console.log("move:", exploration.length);
  console.log("tree:", exploration[exploration.length - 1].Deflate().children);
  fetch(API_ENDPOINT_AUTH, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
    },
    body: JSON.stringify({
      query: "save_exploration",
      pars: {
        game: gameid,
        move: exploration.length,
        tree: exploration[exploration.length - 1].Deflate().children,
      },
    }),
  });
}

function doView(
  me,
  game,
  move,
  explorer,
  explorationRef,
  focus,
  errorMessageRef,
  errorSetter,
  focusSetter,
  moveSetter,
  partialMoveRenderRef,
  renderrepSetter,
  movesRef,
  statusRef
) {
  let node = getFocusNode(explorationRef.current, focus);
  let gameEngineTmp = GameFactory(game.metaGame, node.state);
  let partialMove = false;
  if (move.valid && move.complete < 1 && move.canrender === true)
    partialMove = true;
  let simMove = false;
  let m = move.move;
  if (game.simultaneous) {
    simMove = true;
    m = game.players.map((p) => (p.id === me.id ? m : "")).join(",");
  }
  try {
    gameEngineTmp.move(m, partialMove || simMove);
  } catch (err) {
    if (err.name === "UserFacingError") {
      errorMessageRef.current = err.client;
    } else {
      errorMessageRef.current = err.message;
    }
    errorSetter(true);
    return;
  }
  // console.log("explorationRef:",explorationRef);
  // console.log("statusRef:",statusRef);
  setStatus(
    gameEngineTmp,
    game,
    partialMove || simMove,
    move,
    statusRef.current
  );
  if (!partialMove) {
    node = getFocusNode(explorationRef.current, focus);
    let newstate = gameEngineTmp.serialize();
    // console.log("newstate", newstate);
    const pos = node.AddChild(
      move.move,
      newstate,
      (node.toMove + 1) % game.players.length,
      gameEngineTmp
    );
    saveExploration(explorationRef.current, game.id, me, explorer);
    let newfocus = cloneDeep(focus);
    newfocus.exPath.push(pos);
    newfocus.canExplore = canExploreMove(
      game,
      explorationRef.current,
      newfocus
    );
    focusSetter(newfocus);
    moveSetter({
      ...gameEngineTmp.validateMove(""),
      previous: "",
      move: "",
    });
    if (newfocus.canExplore && !game.noMoves)
      movesRef.current = gameEngineTmp.moves();
  } else {
    moveSetter(move);
  }
  partialMoveRenderRef.current = partialMove;
  // console.log('setting renderrep 1');
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
  return (
    (game.canExplore || (game.canSubmit && focus.exPath.length === 0)) && // exploring (beyond move input) is supported or it is my move and we are just looking at the current position
    exploration !== null &&
    focus.moveNumber === exploration.length - 1 // we aren't looking at history
  );
}

function processNewSettings(
  newGameSettings,
  newUserSettings,
  gameRef,
  settingsSetter,
  gameSettingsSetter,
  userSettingsSetter
) {
  gameSettingsSetter(newGameSettings);
  userSettingsSetter(newUserSettings);
  if (gameRef.current !== null) {
    var newSettings = {};
    const game = gameRef.current;
    newSettings.color = getSetting(
      "color",
      "standard",
      newGameSettings,
      newUserSettings,
      game.metaGame
    );
    newSettings.annotate = getSetting(
      "annotate",
      true,
      newGameSettings,
      newUserSettings,
      game.metaGame
    );
    newSettings.rotate =
      newGameSettings === undefined || newGameSettings.rotate === undefined
        ? 0
        : newGameSettings.rotate;
    setupColors(newSettings, game);
    settingsSetter(newSettings);
  }
}

function processNewMove(
  newmove,
  explorer,
  me,
  focus,
  gameRef,
  movesRef,
  statusRef,
  explorationRef,
  errorMessageRef,
  partialMoveRenderRef,
  renderrepSetter,
  errorSetter,
  focusSetter,
  moveSetter
) {
  // if the move is complete, or partial and renderable, update board
  if (
    (newmove.valid && newmove.complete > 0 && newmove.move !== "") ||
    newmove.canrender === true
  ) {
    doView(
      me,
      gameRef.current,
      newmove,
      explorer,
      explorationRef,
      focus,
      errorMessageRef,
      errorSetter,
      focusSetter,
      moveSetter,
      partialMoveRenderRef,
      renderrepSetter,
      movesRef,
      statusRef
    );
  }
  // if the user is starting a new move attempt, it isn't yet renderable and the current render is for a partial move, go back to showing the current position
  else if (
    partialMoveRenderRef.current &&
    !newmove.move.startsWith(newmove.previous)
  ) {
    let node = getFocusNode(explorationRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    partialMoveRenderRef.current = false;
    setStatus(gameEngineTmp, gameRef.current, false, "", statusRef.current);
    if (focus.canExplore && !gameRef.current.noMoves)
      movesRef.current = gameEngineTmp.moves();
    renderrepSetter(gameEngineTmp.render(gameRef.current.me + 1));
    moveSetter(newmove);
  } else {
    moveSetter(newmove); // not renderable yet
  }
}

function GameMove(props) {
  const [renderrep, renderrepSetter] = useState(null);
  // The place in the tree the display is currently showing. If history, just the move number. If exploration, the move from which we are exploring and then the path through the tree.
  const [focus, focusSetter] = useState(null);
  const [move, moveSetter] = useState({
    move: "",
    valid: true,
    message: "",
    complete: 0,
    previous: "",
  });
  const [error, errorSetter] = useState(false);
  const [showSettings, showSettingsSetter] = useState(false);
  const [showResignConfirm, showResignConfirmSetter] = useState(false);
  const [showTimeoutConfirm, showTimeoutConfirmSetter] = useState(false);
  const [showGameDetails, showGameDetailsSetter] = useState(false);
  const [showGameDump, showGameDumpSetter] = useState(false);
  const [showInject, showInjectSetter] = useState(false);
  const [injectedState, injectedStateSetter] = useState("");
  const [userSettings, userSettingsSetter] = useState();
  const [gameSettings, gameSettingsSetter] = useState();
  const [isZoomed, isZoomedSetter] = useState(false);
  const [settings, settingsSetter] = useState(null);
  const [comments, commentsSetter] = useState([]);
  const [commentsTooLong, commentsTooLongSetter] = useState(false);
  const [submitting, submittingSetter] = useState(false);
  const [explorationFetched, explorationFetchedSetter] = useState(false);
  const [newChat, newChatSetter] = useState(false);
  const [globalMe] = useContext(MeContext);
  const [gameRec, gameRecSetter] = useState(undefined);
  const [explorer, explorerSetter] = useState(false);
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
  // Array of GameNodes at each move. For games that are not complete the node at the current move (last entry in the array) holds the tree of explored moves.
  const explorationRef = useRef(null);
  const [myMove, myMoveSetter] = useContext(MyTurnContext);
  //   if (myMove !== undefined) {
  //     console.log(`Fetched MyMoveContext`);
  //     console.log(JSON.stringify(myMove));
  //     console.log(myMove.length);
  //   } else {
  //     console.log("Could not find context");
  //   }

  const { t, i18n } = useTranslation();
  //   const { state } = useLocation();
  const { metaGame, gameID } = useParams();

  const gameDeets = gameinfo.get(metaGame);
  let gameEngine;
  if (gameDeets.playercounts.length > 1) {
    gameEngine = GameFactory(gameDeets.uid, 2);
  } else {
    gameEngine = GameFactory(gameDeets.uid);
  }
  let designers = gameDeets.people
    .filter((p) => p.type === "designer")
    .map((p) => p.name);
  let designerString;
  if (designers.length === 1) designerString = "Designer: ";
  else designerString = "Designers: ";
  designerString += designers.join(", ");

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    var lng = "en";
    if (globalMe && globalMe.language !== undefined) lng = globalMe.language;
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
      console.log(`changed language  to ${lng}`);
    }
  }, [i18n, globalMe]);

  useEffect(() => {
    async function fetchData() {
      let token = null;
      try {
        const usr = await Auth.currentAuthenticatedUser();
        token = usr.signInUserSession.idToken.jwtToken;
      } catch (err) {
        // OK, non logged in user viewing the game
      }
      try {
        let data;
        let status;
        if (token) {
          const res = await fetch(API_ENDPOINT_AUTH, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: "get_game",
              pars: {
                id: gameID,
              },
            }),
          });
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = JSON.parse(result.body);
            errorSetter(true);
          } else {
            const result = await res.json();
            console.log(result);
            data = JSON.parse(result.body);
          }
        } else {
          var url = new URL(API_ENDPOINT_OPEN);
          url.searchParams.append("query", "get_game");
          url.searchParams.append("id", gameID);
          const res = await fetch(url);
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = result;
            errorSetter(true);
          } else {
            data = await res.json();
          }
        }
        if (status === 200) {
          console.log("game fetched:", data.game);
          setupGame(
            data.game,
            gameRef,
            globalMe,
            false,
            partialMoveRenderRef,
            renderrepSetter,
            statusRef,
            movesRef,
            focusSetter,
            explorationRef,
            moveSetter,
            gameRecSetter
          );
          processNewSettings(
            gameRef.current.me > -1
              ? data.game.players.find((p) => p.id === globalMe.id).settings
              : {},
            globalMe?.settings,
            gameRef,
            settingsSetter,
            gameSettingsSetter,
            userSettingsSetter
          );
          if (data.comments !== undefined) {
            commentsSetter(data.comments);
            if (
              data.comments.reduce(
                (s, a) => s + 110 + Buffer.byteLength(a.comment, "utf8"),
                0
              ) > 350000
            ) {
              commentsTooLongSetter(true);
            }
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }
    fetchData();
  }, [globalMe, renderrepSetter, focusSetter, explorerSetter, gameID]);

  useEffect(() => {
    async function fetchData() {
      explorationFetchedSetter(true);
      let token = null;
      try {
        const usr = await Auth.currentAuthenticatedUser();
        token = usr.signInUserSession.idToken.jwtToken;
      } catch (err) {
        // non logged in user viewing the game
      }
      try {
        let data;
        let status;
        if (token) {
          const res = await fetch(API_ENDPOINT_AUTH, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: "get_exploration",
              pars: {
                game: gameID,
                move: explorationRef.current.length,
              },
            }),
          });
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = JSON.parse(result.body);
            errorSetter(true);
          } else {
            const result = await res.json();
            console.log(result);
            data = JSON.parse(result.body);
            console.log("exploration fetched:", data);
            mergeExploration(gameRef.current, explorationRef.current, data);
            focusSetter(cloneDeep(focus)); // just to trigger a rerender...
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }
    if (focus && !explorationFetched && gameRef.current.canExplore) {
      console.log("fetching exploration");
      fetchData();
    }
  }, [focus, explorationFetched, gameID]);

  // when the user clicks on the list of moves (or move list navigation)
  const handleGameMoveClick = (foc) => {
    // console.log("foc = ", foc);
    let node = getFocusNode(explorationRef.current, foc);
    if (
      !isExplorer(explorer, globalMe) &&
      foc.moveNumber === explorationRef.current.length - 1
    ) {
      node.children = []; // if the user doesn't want to explore, don't confuse them with even 1 move variation.
    }
    let engine = GameFactory(game.metaGame, node.state);
    partialMoveRenderRef.current = false;
    foc.canExplore = canExploreMove(game, explorationRef.current, foc);
    if (foc.canExplore && !game.noMoves) {
      movesRef.current = engine.moves();
    }
    focusSetter(foc);
    renderrepSetter(
      engine.render(gameRef.current.me ? gameRef.current.me + 1 : 1)
    );
    const isPartialSimMove =
      gameRef.current.simultaneous &&
      (foc.exPath.length === 1 ||
        (foc.exPath.length === 0 &&
          foc.moveNumber === explorationRef.current.length - 1 &&
          !gameRef.current.canSubmit));
    setStatus(engine, gameRef.current, isPartialSimMove, "", statusRef.current);
    moveSetter({ ...engine.validateMove(""), move: "", previous: "" });
  };

  function handleReset() {
    if (
      focus.moveNumber + focus.exPath.length !==
      explorationRef.current.length - 1
    )
      handleGameMoveClick({
        moveNumber: explorationRef.current.length - 1,
        exPath: [],
      });
  }

  // handler when user types a move, selects a move (from list of available moves) or clicks on his stash.
  const handleMove = (value) => {
    let node = getFocusNode(explorationRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    let result;
    if (gameRef.current.simultaneous)
      result = gameEngineTmp.validateMove(value, gameRef.current.me + 1);
    else result = gameEngineTmp.validateMove(value);
    result.move = value;
    result.previous = move.move;
    // console.log(result);
    processNewMove(
      result,
      explorer,
      globalMe,
      focus,
      gameRef,
      movesRef,
      statusRef,
      explorationRef,
      errorMessageRef,
      partialMoveRenderRef,
      renderrepSetter,
      errorSetter,
      focusSetter,
      moveSetter
    );
  };

  // handler when user clicks on "complete move" (for a partial move that could be complete)
  const handleView = () => {
    const newmove = cloneDeep(move);
    newmove.complete = 1;
    processNewMove(
      newmove,
      explorer,
      globalMe,
      focus,
      gameRef,
      movesRef,
      statusRef,
      explorationRef,
      errorMessageRef,
      partialMoveRenderRef,
      renderrepSetter,
      errorSetter,
      focusSetter,
      moveSetter
    );
  };

  const handleStashClick = (player, count, movePart) => {
    // console.log(`handleStashClick movePart=${movePart}`);
    handleMove(move.move + movePart);
  };

  useEffect(() => {
    let options = {};

    function boardClick(row, col, piece) {
      // console.log(`boardClick:(${row},${col},${piece})`);
      let node = getFocusNode(explorationRef.current, focusRef.current);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      let result = gameRef.current.simultaneous
        ? gameEngineTmp.handleClickSimultaneous(
            moveRef.current.move,
            row,
            col,
            gameRef.current.me + 1,
            piece
          )
        : gameEngineTmp.handleClick(moveRef.current.move, row, col, piece);
      result.previous = moveRef.current.move;
      processNewMove(
        result,
        explorer,
        globalMe,
        focus,
        gameRef,
        movesRef,
        statusRef,
        explorationRef,
        errorMessageRef,
        partialMoveRenderRef,
        renderrepSetter,
        errorSetter,
        focusSetter,
        moveSetter
      );
    }

    function expand(row, col) {
      let node = getFocusNode(explorationRef.current, focusRef.current);
      let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
      const svg = stackImage.current.querySelector("svg");
      if (svg !== null) svg.remove();
      options.divid = "stack";
      render(gameEngineTmp.renderColumn(row, col), options);
    }

    if (boardImage.current !== null) {
      const svg = boardImage.current.querySelector("svg");
      if (svg !== null) {
        svg.remove();
      }
      if (renderrep !== null && settings !== null) {
        options = { divid: "svg" };
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
          options.boardHover = (row, col, piece) => {
            expand(col, row);
          };
        }
        options.showAnnotations = settings.annotate;
        options.svgid = "theBoardSVG";
        console.log(renderrep);
        console.log("options = ", options);
        // console.log("renderrep useEffect statusRef: ", statusRef);
        render(renderrep, options);
      }
    }
  }, [renderrep, globalMe, focus, settings, explorer]);

  const setError = (error) => {
    if (error.Message !== undefined) errorMessageRef.current = error.Message;
    else errorMessageRef.current = JSON.stringify(error);
    errorSetter(true);
  };

  const handleUpdateRenderOptions = () => {
    showSettingsSetter(true);
  };

  const handleRotate = async () => {
    let newGameSettings = cloneDeep(gameSettings);
    if (newGameSettings === undefined) newGameSettings = {};
    let rotate = newGameSettings.rotate;
    if (rotate === undefined) rotate = 0;
    rotate +=
      (gameRef.current.rotate90 && gameRef.current.numPlayers) > 2 ? 90 : 180;
    if (rotate >= 360) rotate -= 360;
    newGameSettings.rotate = rotate;
    processNewSettings(
      newGameSettings,
      userSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      userSettingsSetter
    );
    if (game.me > -1) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "update_game_settings",
            pars: {
              game: game.id,
              settings: newGameSettings,
            },
          }),
        });
      } catch (error) {
        setError(error);
      }
    }
  };

  const handleSettingsClose = () => {
    showSettingsSetter(false);
  };

  const handleSettingsSave = () => {
    showSettingsSetter(false);
  };

  const handleMark = (mark) => {
    let node = getFocusNode(explorationRef.current, focus);
    node.SetOutcome(mark);
    saveExploration(explorationRef.current, game.id, explorer);
    focusSetter(cloneDeep(focus)); // just to trigger a rerender...
  };

  const handleSubmit = async (draw) => {
    submittingSetter(true);
    if (draw === "drawaccepted") {
      submitMove("", draw);
    } else {
      let m = getFocusNode(explorationRef.current, focus).move;
      submitMove(m, draw);
    }
  };

  const submitMove = async (m, draw) => {
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: "submit_move",
          pars: {
            id: gameRef.current.id,
            move: m,
            draw: draw,
          },
        }),
      });
      const result = await res.json();
      submittingSetter(false);
      if (result.statusCode !== 200) {
        // setError(JSON.parse(result.body));
        throw JSON.parse(result.body);
      }
      myMoveSetter((myMove) => [...myMove.filter((x) => x.id !== gameID)]);
      let game0 = JSON.parse(result.body);
      //   console.log("In handleSubmit. game0:");
      //   console.log(game0);
      setupGame(
        game0,
        gameRef,
        globalMe,
        explorer,
        partialMoveRenderRef,
        renderrepSetter,
        statusRef,
        movesRef,
        focusSetter,
        explorationRef,
        moveSetter,
        gameRecSetter
      );
      // setupColors(settings, gameRef.current, t);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitComment = async (comment) => {
    commentsSetter([
      ...comments,
      { comment: comment, userId: globalMe.id, timeStamp: Date.now() },
    ]);
    // console.log(comments);
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
      const res = await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: "submit_comment",
          pars: {
            id: gameRef.current.id,
            comment: comment,
            moveNumber: explorationRef.current.length - 1,
          },
        }),
      });
      const result = await res.json();
      if (result && result.statusCode && result.statusCode !== 200)
        setError(JSON.parse(result.body));
    } catch (err) {
      console.log(err);
      //setError(err.message);
    }
  };

  const handleResign = () => {
    showResignConfirmSetter(true);
  };

  const handleCloseResignConfirm = () => {
    showResignConfirmSetter(false);
  };

  const handleResignConfirmed = async () => {
    showResignConfirmSetter(false);
    submittingSetter(true);
    submitMove("resign", false);
  };

  const handleTimeout = () => {
    showTimeoutConfirmSetter(true);
  };

  const handleCloseTimeoutConfirm = () => {
    showTimeoutConfirmSetter(false);
  };

  const handleTimeoutConfirmed = async () => {
    showTimeoutConfirmSetter(false);
    submittingSetter(true);
    submitMove("timeout", false);
  };

  const handleInjection = async () => {
    if (
      injectedState !== undefined &&
      injectedState !== null &&
      injectedState.length > 0
    ) {
      const usr = await Auth.currentAuthenticatedUser();
      try {
        let status;
        if (usr.signInUserSession.idToken.jwtToken) {
          const res = await fetch(API_ENDPOINT_AUTH, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
            },
            body: JSON.stringify({
              query: "set_game_state",
              pars: {
                id: gameID,
                newState: injectedState,
              },
            }),
          });
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = JSON.parse(result.body);
            errorSetter(true);
          } else {
            const result = await res.json();
            let game0 = JSON.parse(result.body);
            setupGame(
              game0,
              gameRef,
              globalMe,
              explorer,
              partialMoveRenderRef,
              renderrepSetter,
              statusRef,
              movesRef,
              focusSetter,
              explorationRef,
              moveSetter,
              gameRecSetter
            );
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }

      gameRef.current.state = injectedState;
      showInjectSetter(false);
    }
  };

  const handleInjectChange = (e) => {
    injectedStateSetter(e.target.value);
  };

  const handleExplorer = () => {
    let game = gameRef.current;
    game.canExplore =
      !game.simultaneous && game.toMove !== "" && game.numPlayers === 2;
    explorerSetter(true);
  };

  const navigate = useNavigate();
  const handleNextGame = () => {
    // Randomizing them because otherwise you can never just skip a game for a little later.
    // It will just keep returning you to the first game in the list.
    // TODO: Ideally, though, it would just cycle you through them, but then we'd need some state.
    const others = myMove
      .filter((x) => x.id !== gameID)
      .sort(() => Math.random() - 0.5);
    if (others.length === 0) {
      navigate("/");
    } else {
      const next = others[0];
      navigate(`/move/${next.metaGame}/${next.id}`);
    }
  };

  const game = gameRef.current;
  // console.log("rendering at focus ", focus);
  // console.log("game.me", game ? game.me : "nope");
  console.log(
    "current move node: ",
    explorationRef.current
      ? explorationRef.current[explorationRef.current.length - 1]
      : ""
  );
  if (!error) {
    let toMove;
    if (focus) {
      if (game.simultaneous) {
        toMove = game.toMove; // will only be used at current position
      } else {
        toMove = getFocusNode(explorationRef.current, focus).toMove;
      }
    }
    return (
      <article>
        <div className="columns">
          {/***************** MoveEntry *****************/}
          <div
            className={`column ${
              isZoomed ? "is-one-fifth is-narrow" : "is-one-quarter"
            }`}
          >
            <GameStatus
              status={statusRef.current}
              settings={settings}
              game={game}
              canExplore={focus?.canExplore}
              handleStashClick={handleStashClick}
            />
            <MoveEntry
              move={move}
              toMove={toMove}
              game={gameRef.current}
              moves={movesRef.current}
              exploration={explorationRef.current}
              focus={focus}
              submitting={submitting}
              handlers={[
                handleMove,
                handleMark,
                handleSubmit,
                handleView,
                handleResign,
                handleTimeout,
                handleReset,
              ]}
            />
            {toMove !== "" || gameRec === undefined ? null : (
              <DownloadDataUri
                filename={`AbstractPlay-${metaGame}-${gameID}.json`}
                label="Download completed game record"
                uri={
                  gameRec === undefined
                    ? null
                    : `data:text/json;charset=utf-8,${encodeURIComponent(
                        JSON.stringify(gameRec)
                      )}`
                }
              />
            )}
            <div className="buttons">
              {globalMe?.settings?.all?.exploration === -1 ||
              globalMe?.settings?.all?.exploration === 1 ||
              explorer ||
              !game ||
              game.simultaneous ||
              game.numPlayers !== 2 ||
              toMove === "" ? null : (
                <div className="control" style={{ paddingTop: "1em" }}>
                  <button className="button apButton" onClick={handleExplorer}>
                    <span>{t("Explore")}</span>
                  </button>
                </div>
              )}
              {toMove === "" ? null : (
                <div className="control" style={{ paddingTop: "1em" }}>
                  <button className="button apButton" onClick={handleNextGame}>
                    <span>
                      {t("NextGame")} ({myMove.length})
                    </span>
                    <span className="icon">
                      <i className="fa fa-forward"></i>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/***************** Board *****************/}
          <div className="column">
            <h1 className="subtitle lined">
              <span>{gameinfo.get(metaGame).name}</span>
            </h1>
            {gameRef.current?.stackExpanding ? (
              <div className="board">
                <div className="stack" id="stack" ref={stackImage}></div>
                <div className="stackboard" id="svg" ref={boardImage}></div>
              </div>
            ) : (
              <div className="board" id="svg" ref={boardImage}></div>
            )}
            <div className="boardButtons">
              <button
                className="fabtn align-right"
                onClick={handleRotate}
                title={t("RotateBoard")}
              >
                <i className="fa fa-refresh"></i>
              </button>
              <button
                className="fabtn align-right"
                onClick={handleUpdateRenderOptions}
                title={t("BoardSettings")}
              >
                <i className="fa fa-cog"></i>
              </button>
              <button
                className="fabtn align-right"
                onClick={() => {
                  showGameDetailsSetter(true);
                }}
                title={t("GameInfo")}
              >
                <i className="fa fa-info"></i>
              </button>
              <button
                className="fabtn align-right"
                onClick={() => {
                  showGameDumpSetter(true);
                }}
                title={t("DebugModal")}
              >
                <i className="fa fa-bug"></i>
              </button>
              <button
                className="fabtn align-right"
                onClick={() => {
                  isZoomedSetter(!isZoomed);
                }}
                title={t("ToggleZoom")}
              >
                {isZoomed ? (
                  <i className="fa fa-search-minus"></i>
                ) : (
                  <i className="fa fa-search-plus"></i>
                )}
              </button>
              {!globalMe || globalMe.admin !== true ? (
                ""
              ) : (
                <button
                  className="fabtn align-right"
                  onClick={() => {
                    showInjectSetter(true);
                  }}
                  title={"Inject state"}
                >
                  <i className="fa fa-magic"></i>
                </button>
              )}
            </div>
          </div>
          {/***************** GameMoves *****************/}
          {/* Hidden when zooming */}
          {isZoomed ? (
            ""
          ) : (
            <div
              className={`column ${
                isZoomed ? "is-one-fifth is-narrow" : "is-one-quarter"
              }`}
            >
              <GameMoves
                focus={focus}
                game={game}
                exploration={explorationRef.current}
                handleGameMoveClick={handleGameMoveClick}
              />
            </div>
          )}
        </div>
        {/* columns */}
        <div className="columns">
          {/* Comment entry */}
          <div className="column is-half is-offset-one-quarter">
            {focus && game.me > -1 ? (
              <GameComment
                className="gameComment"
                handleSubmit={submitComment}
                tooMuch={commentsTooLong}
              />
            ) : (
              ""
            )}
          </div>
        </div>
        {/* columns */}
        <div className="columns">
          {/* Comments */}
          <div className="column is-three-fifths is-offset-one-fifth">
            {focus ? (
              <div>
                <h1 className="subtitle lined">
                  <span>{t("GameSummary")}</span>
                </h1>
                <NewChatContext.Provider value={[newChat, newChatSetter]}>
                  <MoveResults
                    className="moveResults"
                    results={game?.moveResults}
                    comments={comments}
                    players={gameRef.current?.players}
                  />
                </NewChatContext.Provider>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        {/* columns */}
        {!newChat ? "" : <NewChatMarker />}
        <RenderOptionsModal
          show={showSettings}
          game={game}
          settings={userSettings}
          gameSettings={gameSettings}
          processNewSettings={(newGameSettings, newUserSettings) =>
            processNewSettings(
              newGameSettings,
              newUserSettings,
              gameRef,
              settingsSetter,
              gameSettingsSetter,
              userSettingsSetter
            )
          }
          showSettingsSetter={showSettingsSetter}
          setError={setError}
          handleClose={handleSettingsClose}
          handleSave={handleSettingsSave}
        />
        <Modal
          show={showResignConfirm}
          title={t("ConfirmResign")}
          buttons={[
            { label: t("Resign"), action: handleResignConfirmed },
            {
              label: t("Cancel"),
              action: handleCloseResignConfirm,
            },
          ]}
        >
          <div className="content">
            <p>{t("ConfirmResignDesc")}</p>
          </div>
        </Modal>
        <Modal
          show={showTimeoutConfirm}
          title={t("ConfirmTimeout")}
          buttons={[
            { label: t("Claim"), action: handleTimeoutConfirmed },
            {
              label: t("Cancel"),
              action: handleCloseTimeoutConfirm,
            },
          ]}
        >
          <div className="content">
            <p>{t("ConfirmTimeoutDesc")}</p>
          </div>
        </Modal>
        <Modal
          show={showGameDetails}
          title={t("GameInfoFor", { metaGame: gameDeets.name })}
          buttons={[
            {
              label: t("Close"),
              action: () => {
                showGameDetailsSetter(false);
              },
            },
          ]}
        >
          <div className="content">
            <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
              {gameEngine.description() + "\n\n" + designerString}
            </ReactMarkdown>
            <ul className="contained">
              {gameDeets.urls.map((l, i) => (
                <li key={i}>
                  <a href={l} target="_blank" rel="noopener noreferrer">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Modal>
        <Modal
          show={showGameDump}
          title={t("DebugModal")}
          buttons={[
            {
              label: t("Close"),
              action: () => {
                showGameDumpSetter(false);
              },
            },
          ]}
        >
          <div className="content">
            <p>
              If there's a problem with your game, a developer may ask you to
              come to this page and send them the current game state. You can
              either click the "Copy" link below to copy the text to your
              clipboard and then paste it somewhere, or you can click the
              "Download" button to save a text file to your computer, which you
              can then send to the developers. Thank you!
            </p>
            {gameRef === null ||
            gameRef.current === null ||
            gameRef.current.state === null ? (
              ""
            ) : (
              <Fragment>
                <ClipboardCopy copyText={gameRef.current.state} />
                <div className="field">
                  <div className="control">
                    <a
                      href={`data:text/json;charset=utf-8,${encodeURIComponent(
                        gameRef.current.state
                      )}`}
                      download="AbstractPlay-Debug.json"
                    >
                      <button className="button">{t("Download")}</button>
                    </a>
                  </div>
                </div>
              </Fragment>
            )}
          </div>
        </Modal>
        <Modal
          show={showInject}
          title={"Inject state"}
          buttons={[
            {
              label: t("Close"),
              action: () => {
                showInjectSetter(false);
              },
            },
          ]}
        >
          <div className="content">
            <p>
              If you are seeing this and are not a developer, please let an
              admin know immediately.
            </p>
            <p>
              This is a destructive function. Pasting code here will obliterate
              the existing game state and cannot be undone. You have been
              warned.
            </p>
            <div className="field">
              <label className="label" htmlFor="newState">
                JSON to inject
              </label>
              <div className="control">
                <textarea
                  className="textarea"
                  name="newState"
                  placeholder="Paste JSON here"
                  value={injectedState}
                  onChange={handleInjectChange}
                />
              </div>
              <div className="control">
                <button className="button is-danger" onClick={handleInjection}>
                  Inject JSON!
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </article>
    );
  } else {
    return <h4>{errorMessageRef.current}</h4>;
  }
}

export default GameMove;
