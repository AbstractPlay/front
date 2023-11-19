import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { render, renderglyph } from "@abstractplay/renderer";
import { Auth } from "aws-amplify";
import { cloneDeep } from "lodash";
import { API_ENDPOINT_AUTH, API_ENDPOINT_OPEN } from "../config";
import { GameNode } from "./GameMove/GameTree";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import { Buffer } from "buffer";
import GameMoves from "./GameMove/GameMoves";
import GameStatus from "./GameMove/GameStatus";
import MoveEntry from "./GameMove/MoveEntry";
import MoveResults from "./GameMove/MoveResults";
import RenderOptionsModal from "./RenderOptionsModal";
import Modal from "./Modal";
import ClipboardCopy from "./GameMove/ClipboardCopy";
import { MeContext, MyTurnContext } from "../pages/Skeleton";
import DownloadDataUri from "./GameMove/DownloadDataUri";
import UserChats from "./GameMove/UserChats";
import { Canvg } from "canvg";
import Joyride, { STATUS } from "react-joyride";
import { useStorageState } from "react-use-storage-state";

function useQueryString() {
  return new URLSearchParams(useLocation().search);
}

const replaceNames = (rep, players) => {
  let stringRep = JSON.stringify(rep);
  for (let i = 0; i < players.length; i++) {
    const re = new RegExp(`player ${i + 1}`, "gi");
    stringRep = stringRep.replace(re, players[i].name);
  }
  return JSON.parse(stringRep);
};

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
  if (game.scores || game.limitedPieces) {
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

function setCanPublish(game, explorer, me, canPublishSetter) {
  if (
    me &&
    isExplorer(explorer, me) &&
    !game.simultaneous &&
    game.numPlayers === 2 &&
    game.gameOver &&
    game.players.find((p) => p.id === me.id) &&
    (!game.published || !game.published.includes(me.id))
  ) {
    canPublishSetter("yes");
  }
}

function setupGame(
  game0,
  gameRef,
  me,
  explorer,
  partialMoveRenderRef,
  renderrepSetter,
  engineRef,
  statusRef,
  movesRef,
  focusSetter,
  explorationRef,
  moveSetter,
  gameRecSetter,
  publishSetter,
  display,
  navigate
) {
  const info = gameinfo.get(game0.metaGame);
  game0.name = info.name;
  game0.simultaneous =
    info.flags !== undefined && info.flags.includes("simultaneous");
  game0.pie = info.flags !== undefined && info.flags.includes("pie");
  game0.canCheck = info.flags !== undefined && info.flags.includes("check");
  game0.sharedPieces =
    info.flags !== undefined && info.flags.includes("shared-pieces");
  game0.customColours =
    info.flags !== undefined && info.flags.includes("custom-colours");
  game0.canRotate =
    info.flags !== undefined && info.flags.includes("perspective");
  game0.rotate90 = info.flags !== undefined && info.flags.includes("rotate90");
  game0.scores = info.flags !== undefined && info.flags.includes("scores");
  game0.limitedPieces =
    info.flags !== undefined && info.flags.includes("limited-pieces");
  game0.playerStashes =
    info.flags !== undefined && info.flags.includes("player-stashes");
  game0.sharedStash =
    info.flags !== undefined && info.flags.includes("shared-stash");
  game0.noMoves = info.flags !== undefined && info.flags.includes("no-moves");
  game0.automove = info.flags !== undefined && info.flags.includes("automove");
  game0.stackExpanding =
    info.flags !== undefined && info.flags.includes("stacking-expanding");
  if (game0.state === undefined)
    throw new Error("Why no state? This shouldn't happen no more!");
  const engine = GameFactory(game0.metaGame, game0.state);
  moveSetter({ ...engine.validateMove(""), rendered: "", move: "" });
  // eslint-disable-next-line no-prototype-builtins
  game0.canPie =
    game0.pie &&
    engine.stack.length === 2 &&
    // eslint-disable-next-line no-prototype-builtins
    (!game0.hasOwnProperty("pieInvoked") || (game0.pieInvoked = false));
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
        engine.move(game0.partialMove, { partial: true, trusted: true });
    }
    game0.canExplore = false;
  } else {
    game0.canSubmit =
      game0.toMove !== "" && me && game0.players[game0.toMove].id === me.id;
    game0.canExplore = game0.numPlayers === 2 && isExplorer(explorer, me);
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
  engineRef.current = cloneDeep(engine);
  const render = replaceNames(
    engine.render({ perspective: game0.me + 1, altDisplay: display }),
    game0.players
  );
  game0.stackExpanding =
    game0.stackExpanding && render.renderer === "stacking-expanding";
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
  if (engine.gameover && engine.stack.length >= engine.numplayers) {
    gameRecSetter(
      engine.genRecord({
        uid: game0.id,
        players: game0.players.map((p) => {
          return {
            name: p.name,
            uid: p.id,
          };
        }),
        unrated: !game0.rated,
        pied:
          "pieInvoked" in game0 && game0.pieInvoked
            ? game0.pieInvoked
            : undefined,
      })
    );
  }

  let history = [];
  // The following is DESTRUCTIVE! If you need `engine.stack`, do it before here.
  game0.gameOver = engine.gameover;
  const winner = engine.winner;
    // eslint-disable-line no-constant-condition
    while (true) {
    history.unshift(
      new GameNode(
        null,
        engine.lastmove,
        engine.serialize(),
        engine.gameover ? "" : engine.currplayer - 1
      )
    );
    if (
      game0.gameOver &&
      winner.length === 1 &&
      !game0.simultaneous &&
      game0.numPlayers === 2
    ) {
      history[0].outcome = winner[0] - 1;
    }
    engine.stack.pop();
    engine.gameover = false;
    engine.winner = [];
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
  setCanPublish(game0, explorer, me, publishSetter);
  focusSetter(focus0);
  renderrepSetter(render);
  setURL(explorationRef.current, focus0, game0, navigate);
}

function mergeExploration(
  game,
  exploration,
  data,
  me,
  errorSetter,
  errorMessageRef
) {
  const moveNumber = exploration.length;
  if (data[0] && data[0].move === moveNumber) {
    let node = exploration[moveNumber - 1];
    let gameEngine = GameFactory(game.metaGame, node.state);
    mergeMoveRecursive(gameEngine, node, data[0].tree);
  } else if (data[1] && data[1].move === moveNumber - 1) {
    let node = exploration[moveNumber - 1];
    let gameEngine = GameFactory(game.metaGame, node.state);
    // subtree of the move I chose
    const subtree1 = data[1].tree.find((e) =>
      gameEngine.sameMove(exploration[moveNumber - 1].move, e.move)
    );
    if (subtree1) {
      mergeMoveRecursive(
        gameEngine,
        exploration[moveNumber - 1],
        subtree1.children
      );
      saveExploration(
        exploration,
        moveNumber,
        game,
        me,
        true,
        errorSetter,
        errorMessageRef
      );
    }
  } else if (data[2] && data[2].move === moveNumber - 2) {
    let node = exploration[moveNumber - 2];
    let gameEngine = GameFactory(game.metaGame, node.state);
    // subtree of the move I chose
    const subtree1 = data[2].tree.find((e) =>
      gameEngine.sameMove(exploration[moveNumber - 2].move, e.move)
    );
    if (subtree1) {
      gameEngine.move(exploration[moveNumber - 1].move, { trusted: true });
      // subtree of the move my opponent chose
      const subtree2 = subtree1.children.find((e) =>
        gameEngine.sameMove(exploration[moveNumber - 1].move, e.move)
      );
      if (subtree2) {
        mergeMoveRecursive(
          gameEngine,
          exploration[moveNumber - 1],
          subtree2.children
        );
        // save this subtree to the database at this move (we only fetch 2 moves back so this will get lost unless the player explores further)
        saveExploration(
          exploration,
          moveNumber,
          game,
          me,
          true,
          errorSetter,
          errorMessageRef
        );
      }
    }
  }
}

function mergePublicExploration(game, exploration, data) {
  for (const m of data) {
    const version = m.version;
    const move = m.move;
    const tree = m.tree;
    let node = exploration[move - 1];
    node.version = version;
    node.comment = m.tree.comment;
    let gameEngine = GameFactory(game.metaGame, node.state);
    mergeMoveRecursive(gameEngine, node, tree.children);
  }
}

// When publishing, merge private exploration into public exploration
function mergePrivateExploration(
  game,
  exploration,
  data,
  me,
  errorSetter,
  errorMessageRef
) {
  let moveNumbersUpdated = new Set();
  for (const m of data) {
    const version = m.version;
    const move = m.move;
    const tree = m.tree;
    let node = exploration[move - 1];
    if (version) node.version = version;
    let gameEngine = GameFactory(game.metaGame, node.state);
    const added = mergeMoveRecursive2(
      gameEngine,
      exploration,
      move - 1,
      node,
      tree
    );
    added.forEach((e) => moveNumbersUpdated.add(e));
  }
  if (moveNumbersUpdated.size > 0)
    fixMoveOutcomes(exploration, Math.max.apply(this, [...moveNumbersUpdated]));
  moveNumbersUpdated.forEach((e) => {
    saveExploration(
      exploration,
      e + 1,
      game,
      me,
      true,
      errorSetter,
      errorMessageRef
    );
  });
}

// Update outcomes of moves in the game. These aren't in the children of the previous move node, so outcomes need special handling.
function fixMoveOutcomes(exploration, moveNumber) {
  let child = exploration[moveNumber];
  for (let moveNum = moveNumber; moveNum > 0; moveNum--) {
    const parent = exploration[moveNum - 1];
    const mover = 1 - parent.toMove;
    // if player x moved, and the other player (1-x) has a winning reply (outcome = 1-x), then player x loses
    // if player x moved, and the other player (1-x) has only losing replies (outcome = x) (no winning moves, no unknown outcome moves) then player x wins
    let a_child_wins = false;
    let all_children_lose = true;
    if (child.outcome === 1 - mover) a_child_wins = true;
    if (child.outcome !== mover) all_children_lose = false;
    parent.children.forEach((c) => {
      if (c.outcome === 1 - mover) a_child_wins = true;
      if (c.outcome !== mover) all_children_lose = false;
    });
    if (a_child_wins) parent.outcome = 1 - mover;
    else if (all_children_lose) parent.outcome = mover;
    else parent.outcome = -1;
    child = parent;
  }
}

// after you submit a move, move the subtree of that explored move to the actual move.
function mergeExistingExploration(moveNum, exploration, explorationRef) {
  let subtree = undefined;
  moveNum++;
  // eslint-disable-line no-constant-condition
  while (true) {
    let move = explorationRef.current[moveNum].move
      .toLowerCase()
      .replace(/\s+/g, "");
    subtree = exploration.children.find(
      (e) => e.move.toLowerCase().replace(/\s+/g, "") === move
    );
    if (subtree !== undefined) {
      exploration = subtree;
      moveNum++;
      if (moveNum === explorationRef.current.length) {
        explorationRef.current[explorationRef.current.length - 1].children =
          subtree.children;
        break;
      }
    } else {
      break;
    }
  }
}

function mergeMoveRecursive(gameEngine, node, children, newids = true) {
  children.forEach((n) => {
    gameEngine.move(n.move, { trusted: true });
    const pos = node.AddChild(n.move, gameEngine);
    if (newids) node.children[pos].id = n.id;
    if (n.outcome !== undefined && n.children.length === 0) {
      // outcome was set at a leaf of the exploration being merged
      const newnode = node.children[pos];
      if (newnode.outcome === -1) {
        // If the newnode didn't get an outcome from existing exploration, set it now
        newnode.SetOutcome(n.outcome);
      } else if (
        newnode.outcome !== n.outcome &&
        newnode.children.length === 0
      ) {
        // if two leaf nodes disagree on outcome, set it to undecided
        node.children[pos].SetOutcome(-1);
      }
    }
    if (n.comment !== undefined)
      for (const comment of n.comment) node.children[pos].AddComment(comment);
    mergeMoveRecursive(gameEngine, node.children[pos], n.children, newids);
    gameEngine.stack.pop();
    gameEngine.load();
    gameEngine.gameover = false;
    gameEngine.winner = [];
  });
}

// This version will check if exploration followed the actual game. It also returns those move numbers that were actually updated.
function mergeMoveRecursive2(gameEngine, exploration, moveNum, node, children) {
  let movesUpdated = new Set();
  if (moveNum === exploration.length - 1) return movesUpdated;
  const actualNextMove = exploration[moveNum + 1].move;
  children.forEach((n) => {
    gameEngine.move(n.move, { trusted: true });
    if (gameEngine.sameMove(n.move, actualNextMove)) {
      const updated = mergeMoveRecursive2(
        gameEngine,
        exploration,
        moveNum + 1,
        exploration[moveNum + 1],
        n.children
      );
      updated.forEach((e) => movesUpdated.add(e));
    } else {
      const pos = node.AddChild(n.move, gameEngine);
      if (n.outcome !== undefined && n.children.length === 0) {
        // outcome was set at a leaf of the exploration being merged
        const newnode = node.children[pos];
        if (newnode.outcome === -1) {
          // If the newnode didn't get an outcome from existing exploration, set it now
          newnode.SetOutcome(n.outcome);
        } else if (
          newnode.outcome !== n.outcome &&
          newnode.children.length === 0
        ) {
          // if two leaf nodes disagree on outcome, set it to undecided
          node.children[pos].SetOutcome(-1);
        }
      }
      movesUpdated.add(moveNum);
      mergeMoveRecursive(gameEngine, node.children[pos], n.children, false);
    }
    gameEngine.stack.pop();
    gameEngine.load();
    gameEngine.gameover = false;
    gameEngine.winner = [];
  });
  return movesUpdated;
}

function setupColors(settings, game, t) {
  var options = {};
  if (settings.color === "blind") {
    options.colourBlind = true;
    //   } else if (settings.color === "patterns") {
    //     options.patterns = true;
  }
  game.colors = game.players.map((p, i) => {
    if (game.sharedPieces) {
      return { isImage: false, value: game.seatNames[i] };
    } else {
      options.svgid = "player" + i + "color";
      let color = i + 1;
      if (game.customColours) {
        const engine = GameFactory(game.metaGame, game.state);
        color = engine.getPlayerColour(i + 1);
      }
      console.log(JSON.stringify(game));
      return {
        isImage: true,
        value: renderglyph("piece", color, options),
      };
    }
  });
}

async function saveExploration(
  exploration,
  moveNumber,
  game,
  me,
  explorer,
  errorSetter,
  errorMessageRef,
  focus = undefined,
  navigate = undefined
) {
  if (!isExplorer(explorer, me)) return;
  if (!game.gameOver) {
    if (moveNumber !== exploration.length)
      throw new Error("Can't save exploration at this move!");
  }
  let pars = {
    public: game.gameOver,
    game: game.id,
    move: moveNumber,
    // Note that for completed games you can comment on the parent node, so don't just save children
    tree: game.gameOver
      ? exploration[moveNumber - 1].Deflate(game.gameOver)
      : exploration[moveNumber - 1].Deflate(game.gameOver).children,
  };
  if (game.gameOver) {
    pars.version = exploration[moveNumber - 1].version
      ? exploration[moveNumber - 1].version
      : 0;
  }
  const usr = await Auth.currentAuthenticatedUser();
  const res = await fetch(API_ENDPOINT_AUTH, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
    },
    body: JSON.stringify({
      query: "save_exploration",
      pars: pars,
    }),
  });
  if (res.status !== 200) {
    const result = await res.json();
    errorMessageRef.current = JSON.parse(result.body);
    errorSetter(true);
  } else {
    const result = await res.json();
    if (result && result.body) {
      // We only get here when failing to save public exploration (because the move was updated by someone else)
      const data = JSON.parse(result.body);
      const version = data.version;
      const move = data.sk;
      const tree = JSON.parse(data.tree);
      let node = exploration[move - 1];
      node.version = version;
      if (tree.comment !== undefined)
        for (const comment of tree.comment) node.AddComment(comment);
      let gameEngine = GameFactory(game.metaGame, node.state);
      mergeMoveRecursive(gameEngine, node, tree.children);
      if (focus !== undefined) setURL(exploration, focus, game, navigate);
      // Try to save again
      saveExploration(
        exploration,
        move,
        game,
        me,
        explorer,
        errorSetter,
        errorMessageRef,
        focus,
        navigate
      );
    } else if (game.gameOver) {
      exploration[moveNumber - 1].version =
        (exploration[moveNumber - 1].version
          ? exploration[moveNumber - 1].version
          : 0) + 1;
    }
  }
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
  engineRef,
  movesRef,
  statusRef,
  settings,
  navigate
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
  let newfocus = cloneDeep(focus);
  let moves;
  try {
    gameEngineTmp.move(m, { partial: partialMove || simMove });
    if (!partialMove && focus.canExplore && !game.noMoves) {
      moves = gameEngineTmp.moves();
    }
    // check for auto moves
    if (
      !partialMove &&
      focus.canExplore &&
      game.automove &&
      isExplorer(explorer, me)
    ) {
      while (moves.length === 1) {
        if (
          !game.gameOver ||
          !gameEngineTmp.sameMove(
            m,
            explorationRef.current[newfocus.moveNumber + 1].move
          )
        ) {
          let pos = node.AddChild(m, gameEngineTmp);
          newfocus.exPath.push(pos);
          node = node.children[pos];
        } else {
          newfocus = { moveNumber: newfocus.moveNumber + 1, exPath: [] };
          node = getFocusNode(explorationRef.current, newfocus);
        }
        m = moves[0];
        gameEngineTmp.move(m, { partial: partialMove || simMove });
        moves = gameEngineTmp.moves();
      }
    }
  } catch (err) {
    if (err.name === "UserFacingError") {
      errorMessageRef.current = err.client;
    } else {
      errorMessageRef.current = err.message;
    }
    errorSetter(true);
    return;
  }
  move.rendered = m;
  setStatus(
    gameEngineTmp,
    game,
    partialMove || simMove,
    simMove ? move.move : m,
    statusRef.current
  );
  if (!partialMove) {
    if (
      !game.gameOver ||
      !gameEngineTmp.sameMove(
        m,
        explorationRef.current[newfocus.moveNumber + 1].move
      )
    ) {
      const pos = node.AddChild(simMove ? move.move : m, gameEngineTmp);
      if (game.gameOver)
        fixMoveOutcomes(explorationRef.current, newfocus.moveNumber + 1);
      newfocus.exPath.push(pos);
      saveExploration(
        explorationRef.current,
        newfocus.moveNumber + 1,
        game,
        me,
        explorer,
        errorSetter,
        errorMessageRef,
        newfocus,
        navigate
      );
    } else {
      newfocus = { moveNumber: newfocus.moveNumber + 1, exPath: [] };
    }
    newfocus.canExplore = canExploreMove(
      game,
      explorationRef.current,
      newfocus
    );
    focusSetter(newfocus);
    moveSetter({
      ...gameEngineTmp.validateMove(""),
      rendered: "",
      move: "",
    });
    if (newfocus.canExplore && !game.noMoves) {
      movesRef.current = moves;
    }
  } else {
    moveSetter(move);
  }
  partialMoveRenderRef.current = partialMove;
  // console.log('setting renderrep 1');
  engineRef.current = gameEngineTmp;
  renderrepSetter(
    replaceNames(
      gameEngineTmp.render({
        perspective: game.me + 1,
        altDisplay: settings?.display,
      }),
      game.players
    )
  );
  setURL(explorationRef.current, newfocus, game, navigate);
}

function setURL(exploration, focus, game, navigate) {
  let newQueryString;
  if (game.gameOver) {
    if (focus.exPath.length === 0) {
      newQueryString = new URLSearchParams({
        move: focus.moveNumber,
      }).toString();
    } else {
      let node = getFocusNode(exploration, focus);
      newQueryString = new URLSearchParams({
        move: focus.moveNumber,
        nodeid: node.id,
      }).toString();
    }
    navigate(`?${newQueryString}`, { replace: true });
  }
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
    (!game.gameOver && // game isn't over
      (game.canExplore || (game.canSubmit && focus.exPath.length === 0)) && // exploring (beyond move input) is supported or it is my move and we are just looking at the current position
      exploration !== null &&
      focus.moveNumber === exploration.length - 1) || // we aren't looking at history
    (game.gameOver &&
      game.canExplore &&
      focus.moveNumber !== exploration.length - 1) // game is over and exploring is supported
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
    newSettings.display = getSetting(
      "display",
      undefined,
      newGameSettings,
      newUserSettings,
      game.metaGame
    );
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
    return newSettings;
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
  engineRef,
  errorSetter,
  focusSetter,
  moveSetter,
  settings,
  navigate
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
      engineRef,
      movesRef,
      statusRef,
      settings,
      navigate
    );
  }
  // if the user is starting a new move attempt, it isn't yet renderable and the current render is for a partial move, go back to showing the current position
  else if (
    partialMoveRenderRef.current &&
    !newmove.move.startsWith(newmove.rendered)
  ) {
    let node = getFocusNode(explorationRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    partialMoveRenderRef.current = false;
    setStatus(gameEngineTmp, gameRef.current, false, "", statusRef.current);
    if (focus.canExplore && !gameRef.current.noMoves)
      movesRef.current = gameEngineTmp.moves();
    engineRef.current = gameEngineTmp;
    renderrepSetter(
      replaceNames(
        gameEngineTmp.render({
          perspective: gameRef.current.me + 1,
          altDisplay: settings?.display,
        }),
        gameRef.current.players
      )
    );
    newmove.rendered = "";
    moveSetter(newmove);
  } else {
    moveSetter(newmove); // not renderable yet
  }
}

const populateChecked = (gameRef, engineRef, t, setter) => {
  if (gameRef.current?.canCheck) {
    const inCheckArr = engineRef.current.inCheck();
    if (inCheckArr.length > 0) {
      let newstr = "";
      for (const n of inCheckArr) {
        newstr +=
          "<p>" +
          t("InCheck", { player: gameRef.current.players[n - 1].name }) +
          "</p>";
      }
      setter(newstr);
    } else {
      setter("");
    }
  } else {
    setter("");
  }
};

function GameMove(props) {
  const [renderrep, renderrepSetter] = useState(null);
  // The place in the tree the display is currently showing. If history, just the move number. If exploration, the move from which we are exploring and then the path through the tree.
  const [focus, focusSetter] = useState(null);
  const [move, moveSetter] = useState({
    move: "",
    valid: true,
    message: "",
    complete: 0,
    rendered: "",
  });
  const [error, errorSetter] = useState(false);
  const [tourState, tourStateSetter] = useState([]);
  const [showTour, showTourSetter] = useStorageState("joyride-play-show", true);
  const [showSettings, showSettingsSetter] = useState(false);
  const [showMoveConfirm, showMoveConfirmSetter] = useState(false);
  const [showResignConfirm, showResignConfirmSetter] = useState(false);
  const [showTimeoutConfirm, showTimeoutConfirmSetter] = useState(false);
  const [showGameDetails, showGameDetailsSetter] = useState(false);
  const [showGameDump, showGameDumpSetter] = useState(false);
  const [showGameNote, showGameNoteSetter] = useState(false);
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
  const [globalMe] = useContext(MeContext);
  const [gameRec, gameRecSetter] = useState(undefined);
  const [pngExport, pngExportSetter] = useState(undefined);
  const [gameNote, gameNoteSetter] = useState(null);
  const [interimNote, interimNoteSetter] = useState("");
  const [screenWidth, screenWidthSetter] = useState(window.innerWidth);
  const [explorer, explorerSetter] = useState(false); // just whether the user clicked on the explore button. Also see isExplorer.
  // pieInvoked is used to trigger the game reload after the function is called
  const [pieInvoked, pieInvokedSetter] = useState(false);
  // used to construct the localized string of players in check
  const [inCheck, inCheckSetter] = useState("");
  const [drawMessage, drawMessageSetter] = useState("");
  const [canPublish, canPublishSetter] = useState("no");
  const errorMessageRef = useRef("");
  const movesRef = useRef(null);
  const statusRef = useRef({});
  // whether user has entered a partial move that can be rendered
  const partialMoveRenderRef = useRef(false);
  const focusRef = useRef();
  focusRef.current = focus;
  // Revisit this moveRef variable. It works, but is it really needed? It was changed to deal with missing dependency warnings on the useEffect that updates the svg board. Is that really needed?
  // Does it have to be a Ref, or can it just be a regular variable? Or even just the state variable?
  const moveRef = useRef();
  moveRef.current = move;
  const boardImage = useRef();
  const stackImage = useRef();
  const canvasRef = useRef();
  const gameRef = useRef(null);
  // Array of GameNodes at each move. For games that are not complete the node at the current move (last entry in the array) holds the tree of explored moves.
  const explorationRef = useRef(null);
  // This is used for hover effects. Has the currently rendered engine state with partial moves, if any, applied.
  const engineRef = useRef(null);
  const [myMove, myMoveSetter] = useContext(MyTurnContext);
  const params = useQueryString();
  const [moveNumberParam] = useState(params.get("move"));
  const [nodeidParam] = useState(params.get("nodeid"));
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  //   const { state } = useLocation();
  const { metaGame, cbits, gameID } = useParams();
  const cbit = parseInt(cbits, 10);
  const gameDeets = gameinfo.get(metaGame);
  let gameEngine;
  if (gameDeets.playercounts.length > 1) {
    gameEngine = GameFactory(gameDeets.uid, 2);
  } else {
    gameEngine = GameFactory(gameDeets.uid);
  }
  let designerString;
  // eslint-disable-next-line no-prototype-builtins
  if (gameDeets.hasOwnProperty("people")) {
    let designers = gameDeets.people
      .filter((p) => p.type === "designer")
      .map((p) => p.name);
    if (designers.length === 1) {
      designerString = "Designer: ";
    } else {
      designerString = "Designers: ";
    }
    designerString += designers.join(", ");
  }

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    tourStateSetter([
      {
        target: ".tourWelcome",
        content: t("tour.play.welcome"),
      },
      {
        target: ".tourStatus",
        content: t("tour.play.status"),
      },
      {
        target: ".tourMove",
        content: t("tour.play.move"),
      },
      {
        target: ".tourMoveList",
        content: t("tour.play.movelist"),
      },
      {
        target: ".tourChat",
        content: t("tour.play.chat"),
      },
      {
        target: ".tourBoard",
        content: t("tour.play.board"),
      },
      {
        target: ".tourBoardButtons",
        content: t("tour.play.boardbuttons"),
      },
      {
        target: ".tourSettings",
        content: t("tour.play.settings"),
      },
    ]);
  }, [t, tourStateSetter]);

  const handleJoyrideCallback = (data) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
      showTourSetter(false);
    }
  };

  useEffect(() => {
    var lng = "en";
    if (globalMe && globalMe.language !== undefined) lng = globalMe.language;
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
      console.log(`changed language  to ${lng}`);
    }
  }, [i18n, globalMe]);

  useEffect(() => {
    console.log("Fetching game data");
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
                metaGame: metaGame,
                cbit: cbit,
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
          url.searchParams.append("metaGame", metaGame);
          url.searchParams.append("cbit", cbit);
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
            engineRef,
            statusRef,
            movesRef,
            focusSetter,
            explorationRef,
            moveSetter,
            gameRecSetter,
            canPublishSetter,
            globalMe?.settings?.[metaGame]?.display,
            navigate
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
          // check for note
          // note should only be defined if the user is logged in and
          // is the owner of the note.
          if (
            "note" in data.game &&
            data.game.note !== undefined &&
            data.game.note !== null &&
            data.game.note.length > 0
          ) {
            gameNoteSetter(data.game.note);
            interimNoteSetter(data.game.note);
          } else {
            gameNoteSetter(null);
            interimNoteSetter("");
          }
          populateChecked(gameRef, engineRef, t, inCheckSetter);
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }
    // Somehow react loses track of this, so explicitly remove this.
    if (boardImage.current !== null) {
      const svg = boardImage.current.querySelector("svg");
      if (svg !== null) {
        svg.remove();
      }
    }
    fetchData();
  }, [
    globalMe,
    renderrepSetter,
    focusSetter,
    explorerSetter,
    gameID,
    metaGame,
    pieInvoked,
    cbit,
    t,
    navigate,
  ]);

  const handleNoteUpdate = useCallback(
    async (newNote) => {
      if (newNote.length > 0 && !/^\s*$/.test(newNote)) {
        gameNoteSetter(newNote);
      } else {
        gameNoteSetter(null);
      }
      if (globalMe !== undefined) {
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
              query: "update_note",
              pars: {
                gameId: gameRef.current.id,
                note: newNote,
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
      }
    },
    [globalMe, gameNoteSetter]
  );

  useEffect(() => {
    async function fetchPrivateExploration() {
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
            data = JSON.parse(result.body);
            data = data.map((d) => {
              if (d && typeof d.tree === "string") {
                d.tree = JSON.parse(d.tree);
              }
              return d;
            });
            mergeExploration(
              gameRef.current,
              explorationRef.current,
              data,
              globalMe,
              errorSetter,
              errorMessageRef
            );
            focusSetter(cloneDeep(focus)); // just to trigger a rerender...
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }

    async function fetchPublicExploration() {
      explorationFetchedSetter(true);

      var url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_public_exploration");
      url.searchParams.append("game", gameID);
      const res = await fetch(url);
      if (res.status !== 200) {
        const result = await res.json();
        errorMessageRef.current = result;
        errorSetter(true);
      } else {
        const result = await res.json();
        if (result !== undefined && result.length > 0) {
          const data = result.map((d) => {
            if (d && typeof d.tree === "string") {
              d.tree = JSON.parse(d.tree);
            }
            return d;
          });
          mergePublicExploration(gameRef.current, explorationRef.current, data);
          fixMoveOutcomes(
            explorationRef.current,
            explorationRef.current.length - 1
          );
          if (moveNumberParam) {
            const moveNum = parseInt(moveNumberParam, 10);
            let exPath = [];
            if (nodeidParam) {
              exPath = explorationRef.current[moveNum].findNode(nodeidParam);
            }
            handleGameMoveClick({ moveNumber: moveNum, exPath });
          } else {
            focusSetter(cloneDeep(focus)); // just to trigger a rerender...
          }
        }
      }
    }

    if (focus && !explorationFetched && gameRef.current.canExplore) {
      if (gameRef.current.gameOver) {
        fetchPublicExploration();
      } else {
        fetchPrivateExploration();
      }
    }
  }, [
    focus,
    explorationFetched,
    gameID,
    explorer,
    globalMe,
    moveNumberParam,
    nodeidParam,
  ]);

  const handlePlaygroundExport = async (state) => {
    const usr = await Auth.currentAuthenticatedUser();
    console.log("currentAuthenticatedUser", usr);
    const res = await fetch(API_ENDPOINT_AUTH, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
      },
      body: JSON.stringify({
        query: "new_playground",
        pars: {
          metaGame: game.metaGame,
          state,
        },
      }),
    });
    if (res.status !== 200) {
      const result = await res.json();
      errorMessageRef.current = JSON.parse(result.body);
      errorSetter(true);
    } else {
      navigate("/playground");
    }
  };

  const handleResize = () => {
    screenWidthSetter(window.innerWidth);
  };
  window.addEventListener("resize", handleResize);

  // when the user clicks on the list of moves (or move list navigation)
  const handleGameMoveClick = (foc) => {
    // console.log("foc = ", foc);
    let node = getFocusNode(explorationRef.current, foc);
    if (
      !(isExplorer(explorer, globalMe) && game.canExplore) &&
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
    engineRef.current = engine;
    console.log("Rendering in handleGameMoveClick");
    renderrepSetter(
      replaceNames(
        engine.render({
          perspective: gameRef.current.me ? gameRef.current.me + 1 : 1,
          altDisplay: settings?.display,
        }),
        gameRef.current.players
      )
    );
    setURL(explorationRef.current, foc, game, navigate);
    const isPartialSimMove =
      gameRef.current.simultaneous &&
      (foc.exPath.length === 1 ||
        (foc.exPath.length === 0 &&
          foc.moveNumber === explorationRef.current.length - 1 &&
          !gameRef.current.canSubmit));
    setStatus(engine, gameRef.current, isPartialSimMove, "", statusRef.current);
    moveSetter({ ...engine.validateMove(""), move: "", rendered: "" });
  };

  function handleReset() {
    if (
      focus.moveNumber + focus.exPath.length !==
      explorationRef.current.length - 1
    ) {
      handleGameMoveClick({
        moveNumber: explorationRef.current.length - 1,
        exPath: [],
      });
    }
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  }

  function handleToSubmit() {
    handleGameMoveClick({
      moveNumber: explorationRef.current.length - 1,
      exPath: [focus.exPath[0]],
    });
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  }

  // The user has clicked the "Invoke pie rule" button
  const handlePie = async () => {
    console.log("Pie invoked!");
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
          query: "invoke_pie",
          pars: {
            id: gameRef.current.id,
            metaGame: gameRef.current.metaGame,
            cbit: cbit,
          },
        }),
      });
      const result = await res.json();
      if (result.statusCode !== 200) {
        // setError(JSON.parse(result.body));
        throw JSON.parse(result.body);
      }
      pieInvokedSetter(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // handler when user types a move, selects a move (from list of available moves) or clicks on his stash.
  const handleMove = (value) => {
    let node = getFocusNode(explorationRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    let result;
    if (gameRef.current.simultaneous)
      result = gameEngineTmp.validateMove(value, gameRef.current.me + 1);
    else result = gameEngineTmp.validateMove(value);
    result.move = value;
    result.rendered = move.rendered;
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
      engineRef,
      errorSetter,
      focusSetter,
      moveSetter,
      settings,
      navigate
    );
    populateChecked(gameRef, engineRef, t, inCheckSetter);
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
      engineRef,
      errorSetter,
      focusSetter,
      moveSetter,
      settings,
      navigate
    );
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  };

  const handleStashClick = (player, count, movePart, handler) => {
    if (handler) {
      handleMove(handler(move.move, movePart));
    } else {
      handleMove(move.move + movePart);
    }
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
      result.rendered = moveRef.current.rendered;
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
        engineRef,
        errorSetter,
        focusSetter,
        moveSetter,
        settings,
        navigate
      );
      populateChecked(gameRef, engineRef, t, inCheckSetter);
    }

    function expand(row, col) {
      const svg = stackImage.current.querySelector("svg");
      if (svg !== null) svg.remove();
      options.divid = "stack";
      options.svgid = "theStackSVG";
      render(engineRef.current.renderColumn(row, col), options);
    }

    if (boardImage.current !== null) {
      const svg =
        boardImage.current.parentElement.querySelector("#theBoardSVG");
      console.log("remove svg:", svg, "from ", boardImage.current);
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
          // } else if (settings.color === "patterns") {
          //   options.patterns = true;
        }
        if (gameRef.current.stackExpanding) {
          options.boardHover = (row, col, piece) => {
            expand(col, row);
          };
        }
        options.showAnnotations = settings.annotate;
        options.svgid = "theBoardSVG";
        console.log("rendering", renderrep, options);
        render(renderrep, options);
      }
    }
    // render to PNG
    if (boardImage.current !== null && canvasRef !== null) {
      try {
        const ctx = canvasRef.current.getContext("2d");
        let svgstr = boardImage.current.innerHTML;
        if (svgstr !== null && svgstr !== undefined && svgstr.length > 0) {
          const v = Canvg.fromString(ctx, boardImage.current.innerHTML);
          v.resize(1000, 1000, "xMidYMid meet");
          v.render();
          pngExportSetter(canvasRef.current.toDataURL());
          // console.log("Updated PNG generated");
        } else {
          pngExportSetter(undefined);
          // console.log("Empty SVG string generated.");
        }
      } catch (e) {
        pngExportSetter(undefined);
        // console.log("Caught error rendering PNG");
        // console.log(e);
      }
    }
  }, [renderrep, globalMe, focus, settings, explorer, t, navigate]);

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
              metaGame: game.metaGame,
              cbit: cbit,
              settings: newGameSettings,
            },
          }),
        });
      } catch (error) {
        setError(error);
      }
    }
  };

  const processUpdatedSettings = (newGameSettings, newUserSettings) => {
    console.log("processUpdatedSettings", newGameSettings, newUserSettings);
    const newSettings = processNewSettings(
      newGameSettings,
      newUserSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      userSettingsSetter
    );
    if (newSettings?.display) {
      console.log("settings.display", newSettings.display);
      const newRenderRep = replaceNames(
        engineRef.current.render({
          perspective: gameRef.current.me + 1,
          altDisplay: newSettings.display,
        }),
        gameRef.current.players
      );
      renderrepSetter(newRenderRep);
      gameRef.current.stackExpanding =
        newRenderRep.renderer === "stacking-expanding";
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
    if (gameRef.current.gameOver)
      fixMoveOutcomes(explorationRef.current, focus.moveNumber);
    saveExploration(
      explorationRef.current,
      focus.moveNumber + 1,
      game,
      globalMe,
      explorer,
      errorSetter,
      errorMessageRef,
      focus,
      navigate
    );
    focusSetter(cloneDeep(focus)); // just to trigger a rerender...
  };

  const handleSubmit = async (draw) => {
    submittingSetter(true);
    if (globalMe?.settings?.all?.moveConfirmOff) {
      if (draw === "drawaccepted") {
        submitMove("", draw);
      } else {
        let m = getFocusNode(explorationRef.current, focus).move;
        submitMove(m, draw);
      }
    } else {
      drawMessageSetter(draw);
      showMoveConfirmSetter(true);
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
            metaGame: gameRef.current.metaGame,
            cbit: cbit,
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
      const exploration =
        explorationRef.current[explorationRef.current.length - 1];
      const moveNum = explorationRef.current.length - 1;
      setupGame(
        game0,
        gameRef,
        globalMe,
        explorer,
        partialMoveRenderRef,
        renderrepSetter,
        engineRef,
        statusRef,
        movesRef,
        focusSetter,
        explorationRef,
        moveSetter,
        gameRecSetter,
        canPublishSetter,
        settings?.[metaGame]?.display,
        navigate
      );
      if (gameRef.current.canExplore) {
        mergeExistingExploration(moveNum, exploration, explorationRef);
      }
      // setupColors(settings, gameRef.current, t);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitComment = async (comment) => {
    // ignore blank comments
    if (comment.length > 0 && !/^\s*$/.test(comment)) {
      commentsSetter([
        ...comments,
        { comment: comment, userId: globalMe.id, timeStamp: Date.now() },
      ]);
      // console.log(comments);
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      try {
        let players = [];
        let metaIfComplete = undefined;
        if (engineRef.current !== undefined && engineRef.current.gameover) {
          players = [...gameRef.current.players];
          metaIfComplete = metaGame;
        }
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
              players,
              metaGame: metaIfComplete,
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
    }
  };

  const submitNodeComment = async (comment) => {
    // ignore blank comments
    if (comment.length > 0 && !/^\s*$/.test(comment)) {
      const node = getFocusNode(explorationRef.current, focus);
      node.AddComment({ userId: globalMe.id, comment, timeStamp: Date.now() });
      saveExploration(
        explorationRef.current,
        focus.moveNumber + 1,
        game,
        globalMe,
        explorer,
        errorSetter,
        errorMessageRef,
        focus,
        navigate
      );
      focusSetter(cloneDeep(focus));
    }
  };

  const handleResign = () => {
    showResignConfirmSetter(true);
  };

  const handleCloseMoveConfirm = () => {
    submittingSetter(false);
    showMoveConfirmSetter(false);
  };

  const handleMoveConfirmed = async () => {
    showMoveConfirmSetter(false);
    submittingSetter(true);
    if (drawMessage === "drawaccepted") {
      submitMove("", drawMessage);
    } else {
      const m = getFocusNode(explorationRef.current, focus).move;
      submitMove(m, drawMessage);
    }
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
                metaGame: metaGame,
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
              engineRef,
              statusRef,
              movesRef,
              focusSetter,
              explorationRef,
              moveSetter,
              gameRecSetter,
              canPublishSetter,
              settings?.[metaGame]?.display,
              navigate
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
    game.canExplore = !game.simultaneous && game.numPlayers === 2;
    let focus0 = cloneDeep(focus);
    focus0.canExplore = canExploreMove(
      gameRef.current,
      explorationRef.current,
      focus0
    );
    if (
      focus0.canExplore &&
      !focus.canExplore &&
      !game.noMoves &&
      (game.canSubmit || (!game.simultaneous && game.numPlayers === 2))
    ) {
      let node = getFocusNode(explorationRef.current, focus);
      const engine = GameFactory(game.metaGame, node.state);
      if (game.simultaneous) movesRef.current = engine.moves(game.me + 1);
      else movesRef.current = engine.moves();
    }
    focusSetter(focus0);
    setCanPublish(game, explorationRef.current, globalMe, canPublishSetter);
    explorerSetter(true);
  };

  const handlePublishExploration = async () => {
    console.log("Fetching private exploration data");
    canPublishSetter("publishing");
    let token = null;
    try {
      const usr = await Auth.currentAuthenticatedUser();
      token = usr.signInUserSession.idToken.jwtToken;
    } catch (err) {
      // Not logged in...
    }
    if (token) {
      try {
        // mark game as published (don't await)
        fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: "mark_published",
            pars: {
              id: gameID,
              metagame: gameRef.current.metaGame,
            },
          }),
        });
        // fetch private exploration data
        let status;
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: "get_private_exploration",
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
          if (result && result.body) {
            let data = JSON.parse(result.body);
            data = data.map((d) => {
              if (d && typeof d.tree === "string") {
                d.tree = JSON.parse(d.tree);
              }
              return d;
            });
            mergePrivateExploration(
              gameRef.current,
              explorationRef.current,
              data,
              globalMe,
              errorSetter,
              errorMessageRef
            );
            canPublishSetter("no");
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }
  };

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
      navigate(`/move/${next.metaGame}/0/${next.id}`);
    }
  };

  const game = gameRef.current;
  // console.log("rendering at focus ", focus);
  // console.log("game.me", game ? game.me : "nope");
  let exploringCompletedGame = false;
  let nodeComments = [];
  if (!error) {
    let toMove;
    if (focus) {
      if (game.simultaneous) {
        toMove = game.toMove; // will only be used at current position
      } else {
        toMove = getFocusNode(explorationRef.current, focus).toMove;
      }
      if (game.gameOver && focus.canExplore) {
        exploringCompletedGame = true;
        nodeComments = getFocusNode(explorationRef.current, focus).comment;
      }
    }
    return (
      <article>
        <Joyride
          steps={tourState}
          run={showTour}
          callback={handleJoyrideCallback}
          continuous
          showProgress
          showSkipButton
          styles={{
            options: {
              primaryColor: "#008ca8",
            },
          }}
        />
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
                handleToSubmit,
                handleView,
                handleResign,
                handleTimeout,
                handleReset,
                handlePie,
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
              {canPublish === "no" ? null : (
                <div className="control" style={{ paddingTop: "1em" }}>
                  <button
                    className="button apButton is-small"
                    onClick={handlePublishExploration}
                    title={t("PublishHelp")}
                    disabled={canPublish === "publishing"}
                  >
                    <span>{t("Publish")}</span>
                  </button>
                </div>
              )}
              {globalMe?.settings?.all?.exploration === -1 ||
              globalMe?.settings?.all?.exploration === 1 ||
              explorer ||
              !game ||
              game.simultaneous ||
              game.numPlayers !== 2 ? null : (
                <div className="control" style={{ paddingTop: "1em" }}>
                  <button className="button apButton" onClick={handleExplorer}>
                    <span>{t("Explore")}</span>
                  </button>
                </div>
              )}
              {myMove.length < 1 ? null : (
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
            <h1 className="subtitle lined tourWelcome">
              <span>
                {gameinfo.get(metaGame).name}
                {gameRef.current === null || gameRef.current.rated ? null : (
                  <span style={{ fontSize: "smaller", padding: 0, margin: 0 }}>
                    {" (unrated)"}
                  </span>
                )}
              </span>
            </h1>
            {inCheck.length === 0 ? (
              ""
            ) : (
              <div
                className="content inCheck"
                dangerouslySetInnerHTML={{ __html: inCheck }}
              ></div>
            )}
            {gameRef.current?.stackExpanding ? (
              <div className="board">
                <div className="stack" id="stack" ref={stackImage}></div>
                <div className="stackboard" id="svg" ref={boardImage}></div>
              </div>
            ) : (
              <div
                className={
                  isZoomed ? "board tourBoard" : "board tourBoard unZoomedBoard"
                }
                id="svg"
                ref={boardImage}
              ></div>
            )}
            <div className="boardButtons tourBoardButtons">
              {!gameRef?.current?.canRotate ? null : (
                <button
                  className="fabtn align-right"
                  onClick={handleRotate}
                  title={t("RotateBoard")}
                >
                  <i className="fa fa-refresh"></i>
                </button>
              )}
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
                {gameEngine === undefined ||
                gameEngine.notes() === undefined ? (
                  <i className="fa fa-info"></i>
                ) : (
                  <span className="highlight">
                    <i className="fa fa-info"></i>
                  </span>
                )}
              </button>
              {!globalMe ? null : (
                <button
                  className="fabtn align-right"
                  onClick={() => showGameNoteSetter(true)}
                  title={t("GameNoteModal")}
                >
                  {gameNote === undefined ||
                  gameNote === null ||
                  gameNote.length === 0 ? (
                    <i className="fa fa-sticky-note"></i>
                  ) : (
                    <span className="highlight">
                      <i className="fa fa-sticky-note"></i>
                    </span>
                  )}
                </button>
              )}
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
              {pngExport === undefined ? (
                ""
              ) : (
                <a
                  href={pngExport}
                  download={"AbstractPlay-" + metaGame + "-" + gameID + ".png"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <button className="fabtn align-right" title={t("ExportPNG")}>
                    <i className="fa fa-download"></i>
                  </button>
                </a>
              )}
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
              {screenWidth > 770 ? (
                <Fragment>
                  <GameMoves
                    focus={focus}
                    game={game}
                    exploration={explorationRef.current}
                    noExplore={globalMe?.settings?.all?.exploration === -1}
                    handleGameMoveClick={handleGameMoveClick}
                    getFocusNode={getFocusNode}
                    handlePlaygroundExport={handlePlaygroundExport}
                  />
                  <UserChats
                    comments={exploringCompletedGame ? nodeComments : comments}
                    players={gameRef.current?.players}
                    handleSubmit={
                      exploringCompletedGame ? submitNodeComment : submitComment
                    }
                    tooMuch={commentsTooLong}
                    gameid={gameRef.current?.id}
                    exploringCompletedGame={exploringCompletedGame}
                    userId={globalMe?.id}
                  />
                </Fragment>
              ) : (
                <Fragment>
                  <UserChats
                    comments={comments}
                    players={gameRef.current?.players}
                    handleSubmit={submitComment}
                    tooMuch={commentsTooLong}
                    gameid={gameRef.current?.id}
                  />
                  <GameMoves
                    focus={focus}
                    game={game}
                    exploration={explorationRef.current}
                    noExplore={globalMe?.settings?.all?.exploration === -1}
                    handleGameMoveClick={handleGameMoveClick}
                    getFocusNode={getFocusNode}
                    handlePlaygroundExport={handlePlaygroundExport}
                  />
                </Fragment>
              )}
            </div>
          )}
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
                <MoveResults
                  className="moveResults"
                  results={game?.moveResults}
                  comments={comments}
                  players={gameRef.current?.players}
                />
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        {/* columns */}
        <RenderOptionsModal
          show={showSettings}
          game={game}
          settings={userSettings}
          gameSettings={gameSettings}
          processNewSettings={processUpdatedSettings}
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
          show={showMoveConfirm}
          title={t("ConfirmMove")}
          buttons={[
            { label: t("Submit"), action: handleMoveConfirmed },
            {
              label: t("Cancel"),
              action: handleCloseMoveConfirm,
            },
          ]}
        >
          <div className="content">
            <p>{t("ConfirmMoveDesc")}</p>
            <p className="help">{t("ConfirmMoveHelp")}</p>
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
              {gameEngine.description() +
                (designerString === undefined ? "" : "\n\n" + designerString)}
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
            {gameEngine.notes() === undefined ? (
              ""
            ) : (
              <>
                <h2>{t("ImplementationNotes")}</h2>
                <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
                  {gameEngine.notes()}
                </ReactMarkdown>
              </>
            )}
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
                <ClipboardCopy
                  copyText={getFocusNode(explorationRef.current, focus).state}
                />
                <div className="field">
                  <div className="control">
                    <a
                      href={`data:text/json;charset=utf-8,${encodeURIComponent(
                        getFocusNode(explorationRef.current, focus).state
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
        <Modal
          show={showGameNote}
          title={t("GameNoteModal")}
          buttons={[
            {
              label: t("Close"),
              action: () => {
                showGameNoteSetter(false);
                if (gameNote === undefined || gameNote === null) {
                  interimNoteSetter("");
                } else {
                  interimNoteSetter(gameNote);
                }
              },
            },
          ]}
        >
          <div className="content">
            <p>
              Nobody but you can see this note. The note is tied to this game
              and not any specific move. The note will be irretrievably lost
              when the game concludes and is first cleared from your list of
              concluded games.
            </p>
          </div>
          <div className="field">
            <div className="control">
              <textarea
                type="textarea"
                rows={5}
                id="enterANote"
                name="enterANote"
                className="textarea"
                value={interimNote}
                placeholder={t("Comment")}
                onChange={(e) => {
                  interimNoteSetter(e.target.value);
                  return false;
                }}
              ></textarea>
            </div>
            {interimNote.length > 250 ? (
              <p className="help is-danger" style={{ textAlign: "right" }}>
                {interimNote.length} / 250
              </p>
            ) : (
              <p className="help" style={{ textAlign: "right" }}>
                {interimNote.length} / 250
              </p>
            )}
            <div className="control">
              {interimNote === gameNote ||
              (interimNote === "" && gameNote === null) ? (
                <button className="button is-small" disabled>
                  {t("UpdateNote")}
                </button>
              ) : (
                <button
                  className="button is-small"
                  onClick={() => handleNoteUpdate(interimNote)}
                >
                  {t("UpdateNote")}
                </button>
              )}
            </div>
          </div>
        </Modal>
        <canvas
          id="pngExportCanvas"
          ref={canvasRef}
          style={{ display: "none" }}
        ></canvas>
      </article>
    );
  } else {
    return <h4>{errorMessageRef.current}</h4>;
  }
}

export default GameMove;
