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
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
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
import MiscButtons from "./GameMove/MiscButtons";
import Board from "./GameMove/Board";
import RenderOptionsModal from "./RenderOptionsModal";
import Modal from "./Modal";
import ClipboardCopy from "./GameMove/ClipboardCopy";
import {
  MeContext,
  MyTurnContext,
  UsersContext,
  ColourContext,
} from "../pages/Skeleton";
import UserChats from "./GameMove/UserChats";
import Joyride, { STATUS } from "react-joyride";
import { useStorageState } from "react-use-storage-state";
import { toast } from "react-toastify";
import { nanoid } from "nanoid";
import { Helmet } from "react-helmet-async";
import { t } from "i18next";

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
    (!me?.settings?.all?.exploration && explorer) // (exploration not set or set to "Always ask") and Explore clicked
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
  } else {
    canPublishSetter("no");
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
  if (game0.state === undefined)
    throw new Error("Why no state? This shouldn't happen no more!");
  const engine = GameFactory(game0.metaGame, game0.state);
  const info = gameinfo.get(game0.metaGame);
  game0.name = info.name;
  game0.simultaneous =
    info.flags !== undefined && info.flags.includes("simultaneous");
  game0.pie =
    info.flags !== undefined &&
    (info.flags.includes("pie") || info.flags.includes("pie-even")) &&
    (typeof engine.shouldOfferPie !== "function" || engine.shouldOfferPie());
  game0.pieEven = info.flags !== undefined && info.flags.includes("pie-even");
  game0.canCheck = info.flags !== undefined && info.flags.includes("check");
  game0.sharedPieces =
    info.flags !== undefined && info.flags.includes("shared-pieces");
  game0.customColours =
    info.flags !== undefined && info.flags.includes("custom-colours");
  game0.customButtons =
    info.flags !== undefined && info.flags.includes("custom-buttons");
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
  game0.noExploreFlag =
    info.flags !== undefined && info.flags.includes("no-explore");
  game0.stackExpanding =
    info.flags !== undefined && info.flags.includes("stacking-expanding");
  let newchat = false;
  if (me !== undefined && me !== null) {
    if (
      me.games !== undefined &&
      me.games !== null &&
      Array.isArray(me.games)
    ) {
      const meGame = me.games.find((g) => g.id === game0.id);
      if (meGame !== undefined) {
        newchat = (meGame.lastChat || 0) > (meGame.seen || 0);
      }
    }
  }
  game0.hasNewChat = newchat;
  if (game0.simultaneous) {
    moveSetter({
      ...engine.validateMove("", gameRef.current?.me + 1),
      rendered: "",
      move: "",
    });
  } else {
    moveSetter({ ...engine.validateMove(""), rendered: "", move: "" });
  }
  // eslint-disable-next-line no-prototype-builtins
  game0.canPie =
    game0.pie &&
    ((typeof engine.isPieTurn === "function" && engine.isPieTurn()) ||
      (typeof engine.isPieTurn !== "function" && engine.stack.length === 2)) &&
    // eslint-disable-next-line no-prototype-builtins
    (!game0.hasOwnProperty("pieInvoked") || game0.pieInvoked === false);
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
    game0.canExplore =
      game0.numPlayers === 2 &&
      isExplorer(explorer, me) &&
      (game0.noExplore !== true || game0.gameOver) &&
      game0.noExploreFlag !== true;
  }
  if (game0.sharedPieces) {
    game0.seatNames = [];
    if (typeof engine.player2seat === "function") {
      for (let i = 1; i <= game0.numPlayers; i++) {
        game0.seatNames.push(engine.player2seat(i));
      }
    } else {
      for (let i = 1; i <= game0.numPlayers; i++) {
        game0.seatNames.push("P" + i.toString());
      }
    }
  }
  if (typeof engine.chatLog === "function") {
    game0.moveResults = engine
      .chatLog(game0.players.map((p) => p.name))
      .map((e, idx) => {
        return { time: e[0], log: e.slice(1).join(" "), ply: idx + 1 };
      })
      .reverse();
  } else {
    console.log("No chatlog function");
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
  // The following is no longer destructive.
  const tmpEngine = GameFactory(game0.metaGame, game0.state);
  game0.gameOver = tmpEngine.gameover;
  const winner = tmpEngine.winner;
  while (true) {
    history.unshift(
      // state to be filled in on demand
      new GameNode(
        null,
        tmpEngine.lastmove,
        null,
        tmpEngine.gameover ? "" : tmpEngine.currplayer - 1
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
    tmpEngine.stack.pop();
    tmpEngine.gameover = false;
    tmpEngine.winner = [];
    if (tmpEngine.stack.length === 0) break;
    tmpEngine.load();
  }
  explorationRef.current = { gameID: game0.id, nodes: history };
  let focus0 = { moveNumber: history.length - 1, exPath: [] };
  focus0.canExplore = canExploreMove(
    gameRef.current,
    explorationRef.current.nodes,
    focus0
  );
  setCanPublish(game0, explorer, me, publishSetter);
  focusSetter(focus0);
  console.log(`(setupGame) ABOUT TO RERENDER! Display setting: ${display}`);
  renderrepSetter(render);
  setURL(explorationRef.current.nodes, focus0, game0, navigate);
}

function getExplorationNode(exploration, game, moveNumber) {
  let node = exploration[moveNumber];
  // rehydrate state if need
  if (node.state === null) {
    let tmpEngine = GameFactory(game.metaGame, game.state);
    if (moveNumber + 1 < tmpEngine.stack.length) {
      tmpEngine.gameover = false;
      tmpEngine.winner = [];
    }
    tmpEngine.stack = tmpEngine.stack.slice(0, moveNumber + 1);
    tmpEngine.load();
    node.state = tmpEngine.cheapSerialize();
  }
  return node;
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
    let node = getExplorationNode(exploration, game, moveNumber - 1);
    let gameEngine = GameFactory(game.metaGame, node.state);
    mergeMoveRecursive(gameEngine, node, data[0].tree);
  } else if (data[1] && data[1].move === moveNumber - 1) {
    let node = getExplorationNode(exploration, game, moveNumber - 1);
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
    console.log("Merging 2 moves back");
    let node = getExplorationNode(exploration, game, moveNumber - 2);
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
          getExplorationNode(exploration, game, moveNumber - 1),
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
    let node = getExplorationNode(exploration, game, move - 1);
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
    let node = getExplorationNode(exploration, game, move - 1);
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
function mergeExistingExploration(
  moveNum,
  cur_exploration,
  exploration,
  game = undefined,
  useSameMove = false
) {
  moveNum++;
  while (true) {
    let move = exploration[moveNum].move.toLowerCase().replace(/\s+/g, "");
    let subtree;
    if (useSameMove) {
      let node = getExplorationNode(exploration, game, moveNum - 1);
      let gameEngine = GameFactory(game.metaGame, node.state);
      subtree = cur_exploration.children.find((e) =>
        gameEngine.sameMove(move, e.move)
      );
    } else {
      subtree = cur_exploration.children.find(
        (e) => e.move.toLowerCase().replace(/\s+/g, "") === move
      );
    }
    if (subtree !== undefined) {
      moveNum++;
      if (moveNum === exploration.length) {
        exploration[exploration.length - 1].children = subtree.children;
        // TODO: Don't we need to save the exploration to DB here? In particular if a whole bunch of auto moves were triggered. Also if
        // we save here, then we only need to fetch the previous move's exploration when the user looks at his game. I think existing exploration after a
        // set of auto moves will be lost if we don't save. Maybe test with Zola, it can trigger many auto moves near the end of the game.
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

function setupColors(settings, game, globalMe, colourContext, node) {
  var options = {};
  if (settings.color === "blind") {
    options.colourBlind = true;
    //   } else if (settings.color === "patterns") {
    //     options.patterns = true;
  }
  if (
    settings.color !== "standard" &&
    settings.color !== "blind" &&
    globalMe !== null &&
    globalMe.palettes !== null
  ) {
    const palette = globalMe.palettes.find((p) => p.name === settings.color);
    if (palette !== undefined) {
      options.colours = [...palette.colours];
      while (options.colours.length < 10) {
        options.colours.push("#fff");
      }
      if (globalMe?.settings?.all?.myColor && game.me > 0) {
        const mycolor = options.colours.shift();
        options.colours.splice(game.me, 0, mycolor);
      }
    }
  }
  game.colors = game.players.map((p, i) => {
    if (game.sharedPieces) {
      return { isImage: false, value: game.seatNames[i] };
    } else {
      options.svgid = "player" + i + "color";
      options.colourContext = colourContext;
      let color = i + 1;
      if (game.customColours) {
        let engine;
        if (node === undefined) {
          engine = GameFactory(game.metaGame, game.state);
        } else {
          engine = GameFactory(game.metaGame, node.state);
        }
        color = engine.getPlayerColour(i + 1);
      }
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
  if (!me || !isExplorer(explorer, me)) return;
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
    errorMessageRef.current = `save_exploration failed, status = ${res.status}, message: ${result.message}`;
    errorSetter(true);
  } else {
    const result = await res.json();
    if (result && result.body) {
      // We only get here when failing to save public exploration (because the move was updated by someone else)
      const data = JSON.parse(result.body);
      const version = data.version;
      const move = data.sk;
      const tree = JSON.parse(data.tree);
      let node = getExplorationNode(exploration, game, move - 1);
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
  exploration,
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
  let node = getFocusNode(exploration, game, focus);
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
    gameEngineTmp.move(m, { partial: partialMove || simMove, emulation: true });
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
      let automoved = false;
      // Don't auto move through pie offer in a non-Playground game.
      while (
        moves.length === 1 &&
        !(
          game.pieEven &&
          ((typeof gameEngineTmp.shouldOfferPie === "function" &&
            gameEngineTmp.shouldOfferPie()) ||
            (typeof gameEngineTmp.shouldOfferPie !== "function" &&
              gameEngineTmp.state().stack.length === 2))
        ) &&
        // need a hack for stopping automoves in some emulated situations
        !gameEngineTmp.__noAutomove
      ) {
        automoved = true;
        if (
          !game.gameOver ||
          !gameEngineTmp.sameMove(m, exploration[newfocus.moveNumber + 1].move)
        ) {
          let pos = node.AddChild(m, gameEngineTmp);
          newfocus.exPath.push(pos);
          node = node.children[pos];
        } else {
          newfocus = { moveNumber: newfocus.moveNumber + 1, exPath: [] };
          node = getFocusNode(exploration, game, newfocus);
        }
        m = moves[0];
        gameEngineTmp.move(m, {
          partial: partialMove || simMove,
          emulation: true,
        });
        moves = gameEngineTmp.moves();
      }
      if (automoved) {
        toast(
          "At least one forced move was automatically made. Review the move tree to see each individual state."
        );
      }
    }
  } catch (err) {
    if (err.name === "UserFacingError") {
      errorMessageRef.current = `doView UserFacingError error with error ${err.client}`;
    } else {
      errorMessageRef.current = `doView error with error ${err.message}`;
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
      !(
        newfocus.exPath.length === 0 &&
        gameEngineTmp.sameMove(m, exploration[newfocus.moveNumber + 1].move)
      )
    ) {
      const pos = node.AddChild(simMove ? move.move : m, gameEngineTmp);
      if (game.gameOver) fixMoveOutcomes(exploration, newfocus.moveNumber + 1);
      newfocus.exPath.push(pos);
      saveExploration(
        exploration,
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
    newfocus.canExplore = canExploreMove(game, exploration, newfocus);
    focusSetter(newfocus);
    if (game.simultaneous) {
      moveSetter({
        ...gameEngineTmp.validateMove("", game.me + 1),
        rendered: "",
        move: "",
      });
    } else {
      moveSetter({ ...gameEngineTmp.validateMove(""), rendered: "", move: "" });
    }

    if (newfocus.canExplore && !game.noMoves) {
      movesRef.current = moves;
    }
  } else {
    moveSetter(move);
  }
  partialMoveRenderRef.current = partialMove;
  // console.log('setting renderrep 1');
  engineRef.current = gameEngineTmp;
  console.log(
    `(doView) ABOUT TO RERENDER! Display setting: ${settings?.display}`
  );
  renderrepSetter(
    replaceNames(
      gameEngineTmp.render({
        perspective: game.me + 1,
        altDisplay: settings?.display,
        ...move.opts,
      }),
      game.players
    )
  );
  setURL(exploration, newfocus, game, navigate);
}

function setURL(exploration, focus, game, navigate) {
  let newQueryString;
  if (game.gameOver) {
    if (focus.exPath.length === 0) {
      newQueryString = new URLSearchParams({
        move: focus.moveNumber,
      }).toString();
    } else {
      let node = getFocusNode(exploration, game, focus);
      newQueryString = new URLSearchParams({
        move: focus.moveNumber,
        nodeid: node.id,
      }).toString();
    }
    navigate(`?${newQueryString}`, { replace: true });
  }
}

function getFocusNode(exp, game, foc) {
  let curNode = getExplorationNode(exp, game, foc.moveNumber);
  for (const p of foc.exPath) {
    curNode = curNode.children[p];
  }
  return curNode;
}

function getAllNodeComments(exploration) {
  const allComments = [];
  
  function traverseNode(node, moveNumber, exPath = []) {
    if (node.comment && Array.isArray(node.comment)) {
      // Add each comment with its path information
      node.comment.forEach(c => {
        allComments.push({
          ...c,
          path: { moveNumber, exPath: [...exPath] },
          inGame: false  // These are all post-game comments
        });
      });
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child, index) => {
        traverseNode(child, moveNumber, [...exPath, index]);
      });
    }
  }
  
  if (exploration && Array.isArray(exploration)) {
    exploration.forEach((node, index) => traverseNode(node, index, []));
  }
  
  return allComments;
}

function canExploreMove(game, exploration, focus) {
  return (
    (!game.gameOver && // game isn't over
      (game.canExplore || (game.canSubmit && focus.exPath.length === 0)) && // exploring (beyond move input) is supported or it is my move and we are just looking at the current position
      exploration !== null &&
      focus.moveNumber === exploration.length - 1 && // we aren't looking at history
      getFocusNode(exploration, game, focus).toMove !== "") || // game (at focus) isn't over
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
  userSettingsSetter,
  globalMe,
  colourContext
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
    setupColors(newSettings, game, globalMe, colourContext);
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
  exploration,
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
      exploration,
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
    let node = getFocusNode(exploration, gameRef.current, focus);
    let gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    partialMoveRenderRef.current = false;
    setStatus(gameEngineTmp, gameRef.current, false, "", statusRef.current);
    if (focus.canExplore && !gameRef.current.noMoves)
      movesRef.current = gameEngineTmp.moves();
    engineRef.current = gameEngineTmp;
    console.log(
      `(processNewMove) ABOUT TO RERENDER! Display setting: ${settings?.display}`
    );
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

const defaultChunkOrder = ["status", "move", "board", "moves", "chat"];

function GameMove(props) {
  const [dbgame, dbgameSetter] = useState(null);
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
  const [refresh, setRefresh] = useState(0);
  const [locked, setLocked] = useState(false);
  const [intervalFunc, setIntervalFunc] = useState(null);
  const [error, errorSetter] = useState(false);
  const [tourState, tourStateSetter] = useState([]);
  const [showTour, showTourSetter] = useStorageState("joyride-play-show", true);
  const [startTour, startTourSetter] = useState(false);
  const [showSettings, showSettingsSetter] = useState(false);
  const [showMoveConfirm, showMoveConfirmSetter] = useState(false);
  const [showResignConfirm, showResignConfirmSetter] = useState(false);
  const [showDeleteSubtreeConfirm, showDeleteSubtreeConfirmSetter] =
    useState(false);
  const [showTimeoutConfirm, showTimeoutConfirmSetter] = useState(false);
  const [showGameDetails, showGameDetailsSetter] = useState(false);
  const [showGameDump, showGameDumpSetter] = useState(false);
  const [showGameNote, showGameNoteSetter] = useState(false);
  const [showInject, showInjectSetter] = useState(false);
  const [injectedState, injectedStateSetter] = useState("");
  const [userSettings, userSettingsSetter] = useState();
  const [gameSettings, gameSettingsSetter] = useState();
  const [settings, settingsSetter] = useState(null);
  const [rotIncrement, rotIncrementSetter] = useState(0);
  const [comments, commentsSetter] = useState([]);
  const [commentsTooLong, commentsTooLongSetter] = useState(false);
  const [submitting, submittingSetter] = useState(false);
  const [explorationFetched, explorationFetchedSetter] = useState(false);
  const [globalMe] = useContext(MeContext);
  const [gameRec, gameRecSetter] = useState(undefined);
  const [showCustomCSS, showCustomCSSSetter] = useState(false);
  const [customCSS, customCSSSetter] = useStorageState("custom-css", {});
  const [newCSS, newCSSSetter] = useState("");
  const [cssActive, cssActiveSetter] = useState(true);
  const [gameNote, gameNoteSetter] = useState(null);
  const [interimNote, interimNoteSetter] = useState("");
  const [screenWidth, screenWidthSetter] = useState(window.innerWidth);
  const [mobileOrder, mobileOrderSetter] = useStorageState(
    "play-mobile-order",
    [...defaultChunkOrder]
  );
  const [verticalLayout, verticalLayoutSetter] = useStorageState(
    "play-vertical-layout",
    false
  );
  const [explorer, explorerSetter] = useState(false); // just whether the user clicked on the explore button. Also see isExplorer.
  const [parenthetical, parentheticalSetter] = useState([]); // any description after the game name (e.g., "unrated", "exploration disabled")
  // pieInvoked is used to trigger the game reload after the function is called
  const [pieInvoked, pieInvokedSetter] = useState(false);
  // used to construct the localized string of players in check
  const [inCheck, inCheckSetter] = useState("");
  const [drawMessage, drawMessageSetter] = useState("");
  const [canPublish, canPublishSetter] = useState("no");
  const [boardKey, boardKeySetter] = useState(nanoid()); // used to trigger board redrawing
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
  // gameID and nodes, an array of GameNodes at each move. For games that are not complete the node at the current move (last entry in the array) holds the tree of explored moves.
  // for completed games every node might hold a tree of explored moves.
  const explorationRef = useRef({ gameID: null, nodes: null });
  // This is used for hover effects. Has the currently rendered engine state with partial moves, if any, applied.
  const engineRef = useRef(null);
  const [myMove, myMoveSetter] = useContext(MyTurnContext);
  const params = useQueryString();
  const [moveNumberParam] = useState(params.get("move"));
  const [nodeidParam] = useState(params.get("nodeid"));
  const navigate = useNavigate();
  const [allUsers] = useContext(UsersContext);
  const [colourContext] = useContext(ColourContext);
  const [colorsChanged, colorsChangedSetter] = useState(0);

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
      .map((p) => {
        if ("urls" in p && p.urls !== undefined && p.urls.length > 0) {
          let str = `[${p.name}](${p.urls[0]})`;
          if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
            str += ` [(AP)](/player/${p.apid})`;
          }
          return str;
        } else if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
          return `[${p.name}](/player/${p.apid})`;
        } else {
          return p.name;
        }
      });
    if (designers.length === 1) {
      designerString = "Designer: ";
    } else {
      designerString = "Designers: ";
    }
    designerString += designers.join(", ");
  }
  let coderString;
  // eslint-disable-next-line no-prototype-builtins
  if (gameDeets.hasOwnProperty("people")) {
    let coders = gameDeets.people
      .filter((p) => p.type === "coder")
      .map((p) => {
        if ("urls" in p && p.urls !== undefined && p.urls.length > 0) {
          let str = `[${p.name}](${p.urls[0]})`;
          if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
            str += ` [(AP)](/player/${p.apid})`;
          }
          return str;
        } else if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
          return `[${p.name}](/player/${p.apid})`;
        } else {
          return p.name;
        }
      });
    if (coders.length === 1) {
      coderString = "Coder: ";
    } else {
      coderString = "Coders: ";
    }
    coderString += coders.join(", ");
  }

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    tourStateSetter([
      {
        target: ".tourWelcome",
        content: t("tour.play.welcome"),
        disableBeacon: true,
      },
      {
        target: ".tourStatus",
        content: t("tour.play.status"),
        disableBeacon: true,
      },
      {
        target: ".tourMove",
        content: t("tour.play.move"),
        disableBeacon: true,
      },
      {
        target: ".tourMoveList",
        content: t("tour.play.movelist"),
        disableBeacon: true,
      },
      {
        target: ".tourChat",
        content: t("tour.play.chat"),
        disableBeacon: true,
      },
      {
        target: ".tourBoard",
        content: t("tour.play.board"),
        disableBeacon: true,
      },
      {
        target: ".tourBoardButtons",
        content: t("tour.play.boardbuttons"),
        disableBeacon: true,
      },
      {
        target: ".tourSettings",
        content: t("tour.play.settings"),
        disableBeacon: true,
      },
    ]);
  }, [t, tourStateSetter]);

  const handleJoyrideCallback = (data) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
      showTourSetter(false);
    }
  };

  // initialize customcss modal
  useEffect(() => {
    if (
      customCSS !== undefined &&
      metaGame in customCSS &&
      customCSS[metaGame] !== undefined
    ) {
      newCSSSetter(customCSS[metaGame].css);
      cssActiveSetter(customCSS[metaGame].active);
    } else {
      newCSSSetter("");
      cssActiveSetter(true);
    }
  }, [customCSS, metaGame]);

  // apply (or not) any custom CSS
  useEffect(() => {
    if (
      customCSS !== undefined &&
      metaGame in customCSS &&
      customCSS[metaGame] !== undefined &&
      customCSS[metaGame].css !== "" &&
      customCSS[metaGame].active
    ) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(customCSS[metaGame].css);
      document.adoptedStyleSheets = [sheet];
    } else {
      document.adoptedStyleSheets = [];
    }
  }, [customCSS, metaGame]);

  useEffect(() => {
    boardKeySetter(nanoid());
  }, [verticalLayout]);

  const copyHWDiagram = async () => {
    if (metaGame === "homeworlds" && gameRef !== null && renderrep !== null) {
      const diagram = {
        numPlayers: gameRef.current.numPlayers,
        universe: [],
      };
      for (let i = 0; i < renderrep.board.length; i++) {
        const node = { ...renderrep.board[i] };
        node.owner = node.seat;
        delete node.seat;
        node.ships = [...renderrep.pieces[i].map((s) => s.substring(1))];
        diagram.universe.push(node);
      }
      try {
        await navigator.clipboard.writeText(JSON.stringify(diagram));
        toast(
          "Current board copied to clipboard. Visit https://hwdiagrams.abstractplay.com to import the diagram."
        );
      } catch (err) {
        toast(`Failed to copy: ${err}`, { type: "error" });
      }
    }
  };

  const handleMoveUp = (key) => {
    const idx = mobileOrder.findIndex((s) => s === key);
    if (idx !== -1) {
      // if first item, move to end
      if (idx === 0) {
        mobileOrderSetter([...mobileOrder.slice(1), mobileOrder[0]]);
      }
      // otherwise, shift
      else {
        const left = mobileOrder.slice(0, idx - 1);
        const right = mobileOrder.slice(idx + 1);
        mobileOrderSetter([
          ...left,
          mobileOrder[idx],
          mobileOrder[idx - 1],
          ...right,
        ]);
      }
      boardKeySetter(nanoid());
    }
  };

  const handleMoveDown = (key) => {
    const idx = mobileOrder.findIndex((s) => s === key);
    if (idx !== -1) {
      // if last item, move to top
      if (idx === mobileOrder.length - 1) {
        mobileOrderSetter([mobileOrder[idx], ...mobileOrder.slice(0, idx)]);
      }
      // otherwise, shift
      else {
        const left = mobileOrder.slice(0, idx);
        const right = mobileOrder.slice(idx + 2);
        mobileOrderSetter([
          ...left,
          mobileOrder[idx + 1],
          mobileOrder[idx],
          ...right,
        ]);
      }
      boardKeySetter(nanoid());
    }
  };

  const saveCustomCSS = () => {
    if (metaGame !== null && metaGame !== undefined) {
      const newobj = JSON.parse(JSON.stringify(customCSS));
      if (newCSS === "") {
        delete newobj[metaGame];
      } else {
        newobj[metaGame] = {
          css: newCSS,
          active: cssActive,
        };
      }
      customCSSSetter(newobj);
    }
    showCustomCSSSetter(false);
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

    // We have some evidence that get_game sometimes fails to connect (but report_problem succeeds), implying that a retry might help. Submitting the attempt count
    // to the backend so that we can monitor this.
    async function fetchWithRetry(fetchFn, maxRetries = 3, baseDelay = 1000) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fetchFn(attempt);
        } catch (error) {
          const isNetworkError =
            error.name === "TypeError" && error.message.includes("fetch");
          const isTemporaryError =
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("ERR_NETWORK");

          if (
            attempt === maxRetries ||
            (!isNetworkError && !isTemporaryError)
          ) {
            throw error;
          }

          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(
            `get_game attempt ${attempt + 1} failed, retrying in ${Math.round(
              delay
            )}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    async function fetchData() {
      let token = null;
      try {
        const usr = await Auth.currentAuthenticatedUser();
        token = usr.signInUserSession.idToken.jwtToken;
      } catch (err) {
        // OK, non logged in user viewing the game
      }

      try {
        const result = await fetchWithRetry(async (attempt) => {
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
                  ...(attempt > 0 && { retryAttempt: attempt }),
                },
              }),
            });
            status = res.status;
            if (status !== 200) {
              const result = await res.json();
              const error = new Error(
                `auth get_game failed, id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}, status = ${status}, message: ${result.message}, body: ${result.body}`
              );
              error.status = status;
              throw error;
            } else {
              const result = await res.json();
              data = JSON.parse(result.body);
            }
          } else {
            var url = new URL(API_ENDPOINT_OPEN);
            url.searchParams.append("query", "get_game");
            url.searchParams.append("id", gameID);
            url.searchParams.append("metaGame", metaGame);
            url.searchParams.append("cbit", cbit);
            if (attempt > 0) {
              url.searchParams.append("retryAttempt", attempt.toString());
            }
            const res = await fetch(url);
            status = res.status;
            if (status !== 200) {
              const result = await res.json();
              const error = new Error(
                `no auth get_game failed, id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}, status = ${status}, message: ${result.message}, body: ${result.body}`
              );
              error.status = status;
              throw error;
            } else {
              data = await res.json();
            }
          }
          return { data, status };
        });

        const { data, status } = result;

        if (
          status === 200 &&
          data !== null &&
          data !== undefined &&
          "game" in data
        ) {
          //   console.log(`Status: ${status}, Data: ${JSON.stringify(data)}`);
          dbgameSetter(data.game);
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
        } else {
          if ("message" in data) {
            errorMessageRef.current = `get_game failed, id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}, status = ${status}, data.message: ${data.message}`;
            errorSetter(true);
          } else {
            errorMessageRef.current = `get_game, An unspecified error occurred while trying to fetch the game: ${JSON.stringify(
              data
            )}`;
            errorSetter(true);
          }
        }
      } catch (error) {
        console.log(error.message);
        errorMessageRef.current = `get_game, error.message: ${String(
          error
        )} for id = ${gameID}, metaGame = ${metaGame}, cbit = ${cbit}`;
        errorSetter(true);

        // Report the error after all retries failed
        reportError(errorMessageRef.current);
      }
    }

    // Don't fetch data if user is refreshing a completed game. No point in fetching the game again, the only thing that could have changed is public exploration
    if (explorationRef.current.gameID === gameID && game && game.gameOver) {
      if (focus?.canExplore) {
        explorationFetchedSetter(false);
      }
    } else {
      fetchData();
    }
  }, [
    gameID,
    metaGame,
    cbit,
    errorSetter,
    errorMessageRef,
    pieInvoked,
    commentsSetter,
    commentsTooLongSetter,
    refresh,
  ]);

  // handle setInterval based on locked and lockedTime
  useEffect(() => {
    if (locked) {
      console.log(`Starting periodic refresh`);
      toast(
        "Starting periodic refresh. The refresh will happen every 60 seconds for 30 minutes or until you click the button again or leave the page."
      );
      const now = Date.now();
      const interval = setInterval(() => {
        const lapsed = Date.now() - now;
        if (lapsed < 30 * 60 * 1000) {
          console.log(`Triggering refresh`);
          setRefresh((val) => val + 1);
        } else {
          console.log("Periodic refreshing timed out");
          setLocked(false);
        }
      }, 60000);
      setIntervalFunc(interval);
    } else {
      if (intervalFunc !== null) {
        console.log(`Stopping periodic refresh`);
        toast("Stopping periodic refresh.");
      }
      clearInterval(intervalFunc);
    }
  }, [locked]); // ignoring intervalFunc as a dependency

  const checkTime = useCallback(async (query) => {
    let token = null;
    try {
      const usr = await Auth.currentAuthenticatedUser();
      token = usr.signInUserSession.idToken.jwtToken;
    } catch (err) {
      // OK, non logged in user viewing the game
    }
    if (token) {
      try {
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: query,
            pars: {
              id: gameRef.current.id,
              metaGame: gameRef.current.metaGame,
            },
          }),
        });
        const result = await res.json();
        if (result.statusCode !== 200) {
          throw JSON.parse(result.body);
        }
        let game0 = JSON.parse(result.body);
        if (game0 !== "not_a_timeloss" && game0 !== "not_abandoned") {
          dbgameSetter(game0);
        }
      } catch (err) {
        setError(
          `checkTime with query: ${query} for metaGame ${gameRef.current.metaGame} and game ${gameRef.current.id} and failed with error: ${err.message}`
        );
      }
    }
  }, []);

  useEffect(() => {
    if (dbgame !== null) {
      // I don't think the gameID check is still needed, but better safe than sorry
      const exploration =
        explorationRef.current && explorationRef.current.gameID === dbgame.id
          ? explorationRef.current.nodes
          : null;
      const foc = cloneDeep(focus);
      const game = dbgame;
      // Preserve explorer state if we're still on the same game (e.g., color change)
      // Reset to false if it's a new game or settings changed to "always off"
      const preserveExplorer = 
        explorationRef.current && 
        explorationRef.current.gameID === dbgame.id &&
        globalMe?.settings?.all?.exploration !== -1;
      setupGame(
        game,
        gameRef,
        globalMe,
        preserveExplorer ? explorer : false,
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
        globalMe?.settings?.[game.metaGame]?.display,
        navigate
      );
      if (exploration !== null) {
        if (explorationRef.current.nodes.length === exploration.length) {
          let ok = true;
          for (let i = 0; ok && i < explorationRef.current.nodes.length; i++) {
            if (exploration[i].move !== explorationRef.current.nodes[i].move) {
              ok = false;
            }
          }
          if (ok) {
            for (let i = 0; i < explorationRef.current.nodes.length; i++) {
              explorationRef.current.nodes[i].children = exploration[i].children;
              explorationRef.current.nodes[i].comment = exploration[i].comment;
              explorationRef.current.nodes[i].commented = exploration[i].commented;
            }
            handleGameMoveClick(foc);
          }
          // if we got here from the "trigger a refresh" button, we should probably also fetch exploration in case the user is exploring on more than one device
          explorationFetchedSetter(false);
        } else if (
          explorationRef.current.nodes.length ===
          exploration.length + 1
        ) {
          // page refreshed and opponent moved
          mergeExistingExploration(
            exploration.length - 1,
            exploration[exploration.length - 1],
            explorationRef.current.nodes,
            gameRef.current,
            true
          );
        }
      }
      processNewSettings(
        gameRef.current.me > -1
          ? game.players.find((p) => p.id === globalMe.id).settings
          : {},
        globalMe?.settings,
        gameRef,
        settingsSetter,
        gameSettingsSetter,
        userSettingsSetter,
        globalMe,
        colourContext
      );
      // check for note
      // note should only be defined if the user is logged in and
      // is the owner of the note.
      if (
        "note" in game &&
        game.note !== undefined &&
        game.note !== null &&
        game.note.length > 0
      ) {
        gameNoteSetter(game.note);
        interimNoteSetter(game.note);
      } else {
        gameNoteSetter(null);
        interimNoteSetter("");
      }
      populateChecked(gameRef, engineRef, t, inCheckSetter);
      parentheticalSetter([]);
      if (
        "tournament" in game &&
        game.tournament !== undefined &&
        game.tournament !== null
      ) {
        // Check if tournament reference is already in the new format (metaGame#tournamentId)
        const tournamentLink = game.tournament.includes("#")
          ? `/tournament/${game.tournament.replace("#", "/")}`
          : `/tournament/${game.tournament}?gameId=${game.id}&metaGame=${game.metaGame}`;

        parentheticalSetter((val) => [
          ...val,
          <Link to={tournamentLink}>tournament</Link>,
        ]);
      }
      if ("event" in game && game.event !== undefined && game.event !== null) {
        parentheticalSetter((val) => [
          ...val,
          <Link to={`/event/${game.event}`}>event</Link>,
        ]);
      }
      if (game.rated === false) {
        parentheticalSetter((val) => [...val, "unrated"]);
      }
      if (game.noExplore !== undefined && game.noExplore === true) {
        parentheticalSetter((val) => [...val, "exploration disabled"]);
      }
      if (
        game.toMove !== "" &&
        !game.players.some((p) => p.id === globalMe?.id)
      ) {
        if (game.clockHard) {
          // If you are viewing someone else's game, and a player has timed out, let the server know.
          if (Array.isArray(game.toMove)) {
            const elapsed = Date.now() - game.lastMoveTime;
            if (
              game.toMove.some(
                (p, i) => p && game.players[i].time - elapsed < 0
              )
            ) {
              checkTime("timeloss");
            }
          } else {
            const toMove = parseInt(game.toMove);
            if (
              game.players[toMove].time - (Date.now() - game.lastMoveTime) <
              0
            ) {
              checkTime("timeloss");
            }
          }
        } else {
          // If you are viewing someone else's game, and both players are "red", let the server know to abandon the game.
          const now = new Date().getTime();
          if (
            allUsers !== null &&
            allUsers !== undefined &&
            game.players.every(
              (p) =>
                allUsers.find((u) => u.id === p.id)?.lastSeen <
                now - 1000 * 60 * 60 * 24 * 30
            )
          ) {
            checkTime("abandoned");
          }
        }
      }
      // Somehow react loses track of this, so explicitly remove this.
      if (boardImage.current !== null) {
        const svg = boardImage.current.querySelector("svg");
        if (svg !== null) {
          svg.remove();
        }
      }
    }
  }, [
    dbgame,
    globalMe,
    allUsers,
    pieInvoked,
    t,
    navigate,
    checkTime,
    colourContext,
  ]);

  async function reportError(error) {
    if (!error || error === "") return;

    try {
      const res = await fetch(API_ENDPOINT_OPEN, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "report_problem",
          pars: {
            error: error,
          },
        }),
      });

      const status = res.status;
      if (status !== 200) {
        const result = await res.json();
        console.log(JSON.parse(result.body));

        // Retry with truncated error if first attempt fails
        await fetch(API_ENDPOINT_OPEN, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "report_problem",
            pars: {
              error: `Error reporting another error, status: ${status}, message: ${
                result.message
              }, body: ${
                result.body
              }, original error (truncated): ${error.slice(0, 1000)}`,
            },
          }),
        });
      }
    } catch (e) {
      // Final fallback with truncated error
      await fetch(API_ENDPOINT_OPEN, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "report_problem",
          pars: {
            error: `Error reporting another error: ${String(
              e
            )}, original error (truncated): ${error.slice(0, 1000)}`,
          },
        }),
      });
      console.log(
        `Error auto-reporting another error!\nOriginal error: ${JSON.stringify(
          error
        )}\nFetching error: ${JSON.stringify(e)}`
      );
    }
  }

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
            setError(`update_note failed with: ${result.body}`);
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
                move: explorationRef.current.nodes.length,
              },
            }),
          });
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = `auth get_exploration failed, game = ${gameID}, move = ${explorationRef.current.nodes.length}, status = ${status}, message: ${result.message}, body: ${result.body}`;
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
              explorationRef.current.nodes,
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
        errorMessageRef.current = `get_exploration, error.message: ${error.message}`;
        errorSetter(true);
      }
    }

    async function fetchPublicExploration() {
      explorationFetchedSetter(true);
      console.log("fetching public exploration");
      var url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "get_public_exploration");
      url.searchParams.append("game", gameID);
      const res = await fetch(url);
      if (res.status !== 200) {
        const result = await res.json();
        errorMessageRef.current = `get_public_exploration failed, game = ${gameID}, status = ${res.status}, message: ${result.message}, body: ${result.body}`;
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
          mergePublicExploration(
            gameRef.current,
            explorationRef.current.nodes,
            data
          );
          fixMoveOutcomes(
            explorationRef.current.nodes,
            explorationRef.current.nodes.length - 1
          );
          if (moveNumberParam) {
            const moveNum = parseInt(moveNumberParam, 10);
            let exPath = [];
            if (nodeidParam) {
              exPath =
                explorationRef.current.nodes[moveNum].findNode(nodeidParam);
            }
            handleGameMoveClick({ moveNumber: moveNum, exPath });
          } else {
            focusSetter(cloneDeep(focus)); // just to trigger a rerender...
          }
        } else {
          // even if no exploration, support moveNumberParam
          if (moveNumberParam) {
            const moveNum = parseInt(moveNumberParam, 10);
            handleGameMoveClick({ moveNumber: moveNum, exPath: [] });
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

  const handlePlaygroundExport = async (state, moveNumber) => {
    const usr = await Auth.currentAuthenticatedUser();
    console.log("currentAuthenticatedUser", usr);
    if (state === null) {
      let tmpEngine = GameFactory(game.metaGame, game.state);
      tmpEngine.stack = tmpEngine.stack.slice(0, moveNumber + 1);
      tmpEngine.load();
      state = tmpEngine.cheapSerialize();
    }
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
      errorMessageRef.current = `playground export failed, metaGame = ${game.metaGame}, state = ${state}, status = ${res.status}, message: ${result.message}, body: ${result.body}`;
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
    let node = getFocusNode(explorationRef.current.nodes, game, foc);
    if (
      !(isExplorer(explorer, globalMe) && game.canExplore) &&
      foc.moveNumber === explorationRef.current.nodes.length - 1
    ) {
      node.children = []; // if the user doesn't want to explore, don't confuse them with even 1 move variation.
    }
    let engine = GameFactory(game.metaGame, node.state);
    partialMoveRenderRef.current = false;
    foc.canExplore = canExploreMove(game, explorationRef.current.nodes, foc);
    if (foc.canExplore && !game.noMoves) {
      movesRef.current = engine.moves();
    }
    focusSetter(foc);
    engineRef.current = engine;
    console.log(
      `(handleGameMoveClick) ABOUT TO RERENDER! Display setting: ${settings?.display}`
    );
    renderrepSetter(
      replaceNames(
        engine.render({
          perspective: gameRef.current.me ? gameRef.current.me + 1 : 1,
          altDisplay: settings?.display,
        }),
        gameRef.current.players
      )
    );
    setURL(explorationRef.current.nodes, foc, game, navigate);
    const isPartialSimMove =
      gameRef.current.simultaneous &&
      (foc.exPath.length === 1 ||
        (foc.exPath.length === 0 &&
          foc.moveNumber === explorationRef.current.nodes.length - 1 &&
          !gameRef.current.canSubmit));
    setStatus(engine, gameRef.current, isPartialSimMove, "", statusRef.current);
    if (game.simultaneous) {
      moveSetter({
        ...engine.validateMove("", gameRef.current.me + 1),
        rendered: "",
        move: "",
      });
    } else {
      moveSetter({ ...engine.validateMove(""), rendered: "", move: "" });
    }
    const metaInfo = gameinfo.get(game.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      setupColors(settings, gameRef.current, globalMe, colourContext, node);
      colorsChangedSetter((val) => val + 1);
    }
  };

  function handleReset() {
    if (
      focus.moveNumber + focus.exPath.length !==
      explorationRef.current.nodes.length - 1
    ) {
      handleGameMoveClick({
        moveNumber: explorationRef.current.nodes.length - 1,
        exPath: [],
      });
    }
    populateChecked(gameRef, engineRef, t, inCheckSetter);
  }

  function handleToSubmit() {
    handleGameMoveClick({
      moveNumber: explorationRef.current.nodes.length - 1,
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
      gameRef.current.pieInvoked = true;
    } catch (err) {
      setError(`invoke_pie failed with ${err.message}`);
    }
  };

  // handler when user types a move, selects a move (from list of available moves) or clicks on his stash.
  const handleMove = (value) => {
    let node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
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
      explorationRef.current.nodes,
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
    const metaInfo = gameinfo.get(gameRef.current.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      setupColors(settings, gameRef.current, globalMe, colourContext, {
        state: engineRef.current.state(),
      });
      colorsChangedSetter((val) => val + 1);
    }
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
      explorationRef.current.nodes,
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
      let node = getFocusNode(
        explorationRef.current.nodes,
        gameRef.current,
        focusRef.current
      );
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
        explorationRef.current.nodes,
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
      const metaInfo = gameinfo.get(gameRef.current.metaGame);
      if (metaInfo.flags.includes("custom-colours")) {
        setupColors(settings, gameRef.current, globalMe, colourContext, {
          state: engineRef.current.state(),
        });
        colorsChangedSetter((val) => val + 1);
      }
    }

    function expand(row, col) {
      const svg = stackImage.current.querySelector("svg");
      if (svg !== null) svg.remove();
      options.divid = "stack";
      options.svgid = "theStackSVG";
      options.colourContext = colourContext;
      render(engineRef.current.renderColumn(row, col), options);
    }

    if (boardImage.current !== null) {
      const svg =
        boardImage.current.parentElement.querySelector("#theBoardSVG");
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
        if (settings.color !== "standard" && settings.color !== "blind") {
          console.log(`Looking for a palette named ${settings.color}`);
          const palette = globalMe.palettes?.find(
            (p) => p.name === settings.color
          );
          if (palette !== undefined) {
            options.colours = [...palette.colours];
            while (options.colours.length < 10) {
              options.colours.push("#fff");
            }
            if (globalMe?.settings?.all?.myColor && game.me > 0) {
              const mycolor = options.colours.shift();
              options.colours.splice(game.me, 0, mycolor);
            }
          }
        }
        if (gameRef.current.stackExpanding) {
          options.boardHover = (row, col, piece) => {
            expand(col, row);
          };
        }
        options.showAnnotations = settings.annotate;
        options.svgid = "theBoardSVG";
        options.colourContext = colourContext;
        console.log("rendering", renderrep, options);
        render(renderrep, options);
      }
    }
    // render to PNG
    // if (boardImage.current !== null && canvasRef !== null) {
    //   try {
    //     const ctx = canvasRef.current.getContext("2d");
    //     let svgstr = boardImage.current.innerHTML;
    //     if (svgstr !== null && svgstr !== undefined && svgstr.length > 0) {
    //       const v = Canvg.fromString(ctx, boardImage.current.innerHTML);
    //       v.resize(1000, 1000, "xMidYMid meet");
    //       v.render();
    //       pngExportSetter(canvasRef.current.toDataURL());
    //       // console.log("Updated PNG generated");
    //     } else {
    //       pngExportSetter(undefined);
    //       // console.log("Empty SVG string generated.");
    //     }
    //   } catch (e) {
    //     pngExportSetter(undefined);
    //     // console.log("Caught error rendering PNG");
    //     // console.log(e);
    //   }
    // }
  }, [
    renderrep,
    globalMe,
    focus,
    settings,
    explorer,
    t,
    navigate,
    boardKey,
    colourContext,
  ]);

  useEffect(() => {
    colorsChangedSetter((val) => val + 1);
  }, [colourContext]);

  const setError = (error) => {
    if (error.Message !== undefined) errorMessageRef.current = error.Message;
    else errorMessageRef.current = JSON.stringify(error);
    errorSetter(true);
  };

  const handleUpdateRenderOptions = () => {
    showSettingsSetter(true);
  };

  useEffect(() => {
    /**
     * Takes the current renderrep and deduces the correct minimum rotation increment.
     * A value of 0 means the board may not be rotated.
     */
    const getRotationIncrement = (metaGame, rep, engine) => {
      if (
        "renderer" in rep &&
        rep.renderer !== undefined &&
        (rep.renderer === "stacking-tiles" ||
          rep.renderer === "stacking-3D" ||
          rep.renderer === "entropy" ||
          rep.renderer === "freespace" ||
          rep.renderer.startsWith("conhex") ||
          rep.renderer === "polyomino")
      ) {
        return 0;
      }
      if (
        "renderer" in rep &&
        rep.renderer !== undefined &&
        rep.renderer === "isometric"
      ) {
        return 90;
      }

      const info = gameinfo.get(metaGame);
      if (info === undefined) {
        return 0;
      }
      if (
        "flags" in info &&
        info.flags !== undefined &&
        Array.isArray(info.flags) &&
        info.flags.includes("custom-rotation")
      ) {
        const increment = engine.getCustomRotation();
        if (increment !== undefined) {
          return increment;
        }
      }
      if (
        "board" in rep &&
        rep.board !== undefined &&
        "style" in rep.board &&
        rep.board.style !== undefined
      ) {
        const style = rep.board.style;
        if (
          style.startsWith("squares") ||
          style.startsWith("vertex") ||
          style === "pegboard" ||
          style === "hex-slanted" ||
          style.startsWith("hex-odd") ||
          style.startsWith("hex-even") ||
          style === "snubsquare" ||
          style.startsWith("cairo") ||
          style === "triangles-stacked"
        ) {
          return 90;
        }
        if (style.startsWith("hex-of")) {
          return 60;
        }
        if (style === "sowing") {
          return 180;
        }
      }
      return 0;
    };
    if (renderrep !== null && engineRef.current !== null) {
      rotIncrementSetter(
        getRotationIncrement(metaGame, renderrep, engineRef.current)
      );
    } else {
      rotIncrementSetter(0);
    }
  }, [renderrep, metaGame]);

  const handleRotate = async (dir) => {
    let newGameSettings = cloneDeep(gameSettings);
    if (newGameSettings === undefined) newGameSettings = {};
    let rotate = newGameSettings.rotate;
    if (rotate === undefined) rotate = 0;
    if (dir === "CW") {
      rotate += rotIncrement;
    } else {
      rotate -= rotIncrement;
    }
    rotate = rotate % 360;
    while (rotate < 0) {
      rotate += 360;
    }
    newGameSettings.rotate = rotate;
    processNewSettings(
      newGameSettings,
      userSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      userSettingsSetter,
      globalMe,
      colourContext
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
        setError(`handleRotate update_game_settings error: ${error}`);
      }
    }
  };

  const processUpdatedSettings = (newGameSettings, newUserSettings) => {
    // console.log("processUpdatedSettings", newGameSettings, newUserSettings);
    const newSettings = processNewSettings(
      newGameSettings,
      newUserSettings,
      gameRef,
      settingsSetter,
      gameSettingsSetter,
      userSettingsSetter,
      globalMe,
      colourContext
    );
    if (newSettings?.display) {
      console.log(
        `(processUpdatedSettings) ABOUT TO RERENDER! Display setting: ${newSettings.display}`
      );
      //   console.log(`Current engine state:`);
      //   console.log(engineRef.current.graph);
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
    let node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    node.SetOutcome(mark);
    if (gameRef.current.gameOver)
      fixMoveOutcomes(explorationRef.current.nodes, focus.moveNumber);
    saveExploration(
      explorationRef.current.nodes,
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
        let m = getFocusNode(
          explorationRef.current.nodes,
          gameRef.current,
          focus
        ).move;
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
      const moveNum = explorationRef.current.nodes.length - 1;
      const cur_exploration = explorationRef.current.nodes[moveNum];
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
        globalMe?.settings?.[metaGame]?.display,
        navigate
      );
      if (gameRef.current.canExplore) {
        mergeExistingExploration(
          moveNum,
          cur_exploration,
          explorationRef.current.nodes
        );
      }
      if (gameRef.current.customColours) {
        setupColors(settings, gameRef.current, globalMe, colourContext, {
          state: engineRef.current.state(),
        });
        colorsChangedSetter((val) => val + 1);
      }
    } catch (err) {
      setError(
        `submitMove (move: ${m}, draw: ${draw}) failed with: ${err.message}`
      );
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
        // This used to only pass players and meta if game was completed.
        // I don't see any reason for that, so always passing it so lastChat
        // is always calculated, even for in-progress games.
        let players;
        if (
          gameRef.current !== undefined &&
          gameRef.current.players !== undefined
        ) {
          players = [...gameRef.current.players];
        }
        const metaIfComplete = metaGame;
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
              moveNumber: explorationRef.current.nodes.length - 1,
            },
          }),
        });
        const result = await res.json();
        if (result && result.statusCode && result.statusCode !== 200)
          setError(
            `submit_comment failed, status: ${result.statusCode}, body: ${result.body}`
          );
      } catch (err) {
        console.log(err);
        //setError(err.message);
      }
    }
  };

  const submitNodeComment = async (comment) => {
    // ignore blank comments
    if (comment.length > 0 && !/^\s*$/.test(comment)) {
      const node = getFocusNode(
        explorationRef.current.nodes,
        gameRef.current,
        focus
      );
      node.AddComment({ userId: globalMe.id, comment, timeStamp: Date.now() });
      saveExploration(
        explorationRef.current.nodes,
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
      const m = getFocusNode(
        explorationRef.current.nodes,
        gameRef.current,
        focus
      ).move;
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

  const handleDeleteExploration = () => {
    if (
      getFocusNode(explorationRef.current.nodes, gameRef.current, focus)
        .children.length > 0
    ) {
      // only confirm if non leaf node
      showDeleteSubtreeConfirmSetter(true);
    } else {
      handleDeleteSubtreeConfirmed();
    }
  };

  const handleCloseDeleteSubtreeConfirm = () => {
    showDeleteSubtreeConfirmSetter(false);
  };

  const handleDeleteSubtreeConfirmed = async () => {
    showDeleteSubtreeConfirmSetter(false);
    let node = getFocusNode(
      explorationRef.current.nodes,
      gameRef.current,
      focus
    );
    node.DeleteNode();
    let foc = cloneDeep(focus);
    foc.exPath.pop();
    if (gameRef.current.gameOver)
      fixMoveOutcomes(explorationRef.current.nodes, focus.moveNumber);
    saveExploration(
      explorationRef.current.nodes,
      focus.moveNumber + 1,
      game,
      globalMe,
      explorer,
      errorSetter,
      errorMessageRef,
      foc,
      navigate
    );
    handleGameMoveClick(foc);
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
      // For those games that compress the state, we need to compress first, because we show the decomressed state to be copied.
      let tmpEngine = GameFactory(metaGame, injectedState);
      const injectedState2 = tmpEngine.serialize(); // NOT cheapSerialize!

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
                newState: injectedState2,
              },
            }),
          });
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = `set_game_state failed, game = ${gameID}, metaGame = ${metaGame}, status = ${status}, message: ${result.message}, body: ${result.body}`;
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
              globalMe?.settings?.[metaGame]?.display,
              navigate
            );
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }

      gameRef.current.state = injectedState2;
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
      explorationRef.current.nodes,
      focus0
    );
    if (
      focus0.canExplore &&
      !focus.canExplore &&
      !game.noMoves &&
      (game.canSubmit || (!game.simultaneous && game.numPlayers === 2))
    ) {
      let node = getFocusNode(explorationRef.current.nodes, game, focus);
      const engine = GameFactory(game.metaGame, node.state);
      if (game.simultaneous) movesRef.current = engine.moves(game.me + 1);
      else movesRef.current = engine.moves();
    }
    focusSetter(focus0);
    setCanPublish(
      game,
      explorationRef.current.nodes,
      globalMe,
      canPublishSetter
    );
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
          errorMessageRef.current = `get_private_exploration failed, game = ${gameID}, status = ${status}, message: ${result.message}, body: ${result.body}`;
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
              explorationRef.current.nodes,
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
        errorMessageRef.current = `handlePublishExploration failed with: ${error.message}`;
        errorSetter(true);
      }
    }
  };

  const refreshNextGame = () => {
    async function fetchData() {
      let token = null;
      try {
        const usr = await Auth.currentAuthenticatedUser();
        token = usr.signInUserSession.idToken.jwtToken;
      } catch (err) {
        // OK, non logged in user viewing the game
      }
      if (token !== null) {
        try {
          let status;
          const res = await fetch(API_ENDPOINT_AUTH, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: "next_game",
            }),
          });
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            errorMessageRef.current = `next_game failed, status = ${status}, message: ${result.message}, body: ${result.body}`;
            errorSetter(true);
            return [];
          } else {
            const result = await res.json();
            return JSON.parse(result.body);
          }
        } catch (error) {
          console.log(error);
          errorMessageRef.current = `next_game failed with: ${error.message}`;
          errorSetter(true);
        }
      } else {
        return [];
      }
    }
    fetchData().then((result) => {
      myMoveSetter(result);
      if (Array.isArray(result) && result.length > 0) {
        const next = result[0];
        navigateToTop(`/move/${next.metaGame}/0/${next.id}`);
      } else {
        navigateToTop("/");
      }
    });
  };

  const handleNextGame = () => {
    // If the current game is in the list, move it to the end.
    const local = [...myMove];
    const idx = local.findIndex((x) => x.id === gameID);
    if (idx !== -1) {
      const thisgame = local[idx];
      local.splice(idx, 1);
      if (local.length > 0) {
        local.push(thisgame);
        myMoveSetter(local);
      }
    }
    // Then go to the next game in the list.
    if (local.length === 0) {
      // transfer control to the function that fetches refreshed nextgame data
      return refreshNextGame();
    } else {
      const next = local[0];
      navigateToTop(`/move/${next.metaGame}/0/${next.id}`);
    }
  };

  const navigateToTop = (to) => {
    navigate(to, { replace: true });
    window.scrollTo(0, 0);
  };

  const game = gameRef.current;
  // console.log("rendering at focus ", focus);
  // console.log("game.me", game ? game.me : "nope");
  let commentingCompletedGame = false;
  let allNodeComments = [];
  if (!error) {
    let toMove;
    if (focus) {
      if (game.simultaneous) {
        toMove = game.toMove; // will only be used at current position
      } else {
        toMove = getFocusNode(
          explorationRef.current.nodes,
          gameRef.current,
          focus
        ).toMove;
      }
      if (game.gameOver) {
        commentingCompletedGame = true;
        allNodeComments = getAllNodeComments(explorationRef.current.nodes);
      }
    }
    return (
      <>
        <Helmet>
          <meta
            property="og:title"
            content={`${gameinfo.get(metaGame).name}: Game ${gameID}`}
          />
          <meta
            property="og:url"
            content={`https://play.abstractplay.com/move/${metaGame}/0/${gameID}`}
          />
          <meta
            property="og:description"
            content={`${gameinfo.get(metaGame).name} game ${gameID}`}
          />
        </Helmet>
        <article>
          <Joyride
            steps={tourState}
            run={startTour}
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
          {!showTour ? null : (
            <div className="has-text-centered">
              <div className="field">
                <div className="control">
                  <button
                    className="button apButton"
                    onClick={() => startTourSetter(true)}
                  >
                    {t("tour.general.Take")}
                  </button>
                </div>
                <div className="control">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      onClick={() => {
                        showTourSetter(false);
                        startTourSetter(false);
                      }}
                    />
                    {t("tour.general.Ignore")}
                  </label>
                </div>
              </div>
            </div>
          )}
          {screenWidth < 770 || verticalLayout ? (
            /* Mobile, stacked layout */
            mobileOrder.map((key) => {
              let title;
              let tourClass;
              switch (key) {
                case "status":
                  title = t("Status");
                  tourClass = "tourStatus";
                  break;
                case "move":
                  title = t("MakeMove");
                  tourClass = "tourMove";
                  break;
                case "board":
                  title = gameinfo.get(metaGame).name;
                  tourClass = "tourBoard";
                  break;
                case "moves":
                  title = t("Moves");
                  tourClass = "tourMoveList";
                  break;
                case "chat":
                  title = t("GameSummary");
                  tourClass = "tourChat";
                  break;
                default:
                  throw new Error(`Unrecognized chunk name '${key}'`);
              }
              // Skip empty status displays
              if (key === "status") {
                const status = statusRef.current;
                if (
                  !game ||
                  game.colors === undefined ||
                  ((!game.variants || game.variants.length === 0) &&
                    status.statuses.length === 0 &&
                    ((!game.scores && !game.limitedPieces) ||
                      status.scores.length === 0) &&
                    !game.playerStashes &&
                    !game.sharedStash)
                ) {
                  return null;
                }
              }
              return (
                <div style={{ paddingBottom: "1em" }} key={`${key}|card`}>
                  <div className={"card " + tourClass}>
                    <header className="card-header">
                      <p className="card-header-title">
                        <Link to={`/games/${metaGame}`}>{title}</Link>
                        {key !== "board" ||
                        parenthetical.length === 0 ? null : (
                          <>
                            <span
                              style={{
                                fontSize: "smaller",
                                padding: 0,
                                margin: 0,
                              }}
                            >
                              &nbsp;(
                              {parenthetical.reduce((prev, curr) => [
                                prev,
                                ", ",
                                curr,
                              ])}
                              )
                            </span>
                          </>
                        )}
                      </p>
                      <button
                        className="card-header-icon"
                        aria-label="move up"
                        title="move up"
                        onClick={() => handleMoveUp(key)}
                      >
                        <span className="icon">
                          <i className="fa fa-angle-up" aria-hidden="true"></i>
                        </span>
                      </button>
                      <button
                        className="card-header-icon"
                        aria-label="move down"
                        title="move down"
                        onClick={() => handleMoveDown(key)}
                      >
                        <span className="icon">
                          <i
                            className="fa fa-angle-down"
                            aria-hidden="true"
                          ></i>
                        </span>
                      </button>
                    </header>
                    <div className="card-content">
                      {key === "status" ? (
                        <GameStatus
                          status={statusRef.current}
                          settings={settings}
                          game={game}
                          canExplore={focus?.canExplore}
                          handleStashClick={handleStashClick}
                          locked={locked}
                          setLocked={setLocked}
                          setRefresh={setRefresh}
                          key={`Status|colorSet${colorsChanged}`}
                        />
                      ) : key === "move" ? (
                        <>
                          <MoveEntry
                            move={move}
                            toMove={toMove}
                            game={gameRef.current}
                            moves={movesRef.current}
                            engine={engineRef.current}
                            exploration={explorationRef.current.nodes}
                            focus={focus}
                            submitting={submitting}
                            forceUndoRight={true}
                            screenWidth={screenWidth}
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
                              handleDeleteExploration,
                            ]}
                            key={`Entry|colorSet${colorsChanged}`}
                          />
                          <MiscButtons
                            metaGame={metaGame}
                            gameID={gameID}
                            toMove={toMove}
                            gameRec={gameRec}
                            canPublish={canPublish}
                            handlePublishExploration={handlePublishExploration}
                            handleExplorer={handleExplorer}
                            handleNextGame={handleNextGame}
                            explorer={explorer}
                            game={game}
                            t={t}
                          />
                        </>
                      ) : key === "board" ? (
                        <Board
                          metaGame={metaGame}
                          gameID={gameID}
                          t={t}
                          locked={locked}
                          setLocked={setLocked}
                          setRefresh={setRefresh}
                          gameEngine={gameEngine}
                          gameNote={gameNote}
                          inCheck={inCheck}
                          stackExpanding={
                            gameRef.current?.stackExpanding || false
                          }
                          increment={rotIncrement}
                          stackImage={stackImage}
                          boardImage={boardImage}
                          screenWidth={screenWidth}
                          handleRotate={handleRotate}
                          handleUpdateRenderOptions={handleUpdateRenderOptions}
                          showGameDetailsSetter={showGameDetailsSetter}
                          showGameNoteSetter={showGameNoteSetter}
                          showGameDumpSetter={showGameDumpSetter}
                          showCustomCSSSetter={showCustomCSSSetter}
                          showInjectSetter={showInjectSetter}
                          verticalLayout={verticalLayout}
                          verticalLayoutSetter={verticalLayoutSetter}
                          copyHWDiagram={copyHWDiagram}
                          colourContext={colourContext}
                          hasNewChat={gameRef.current?.hasNewChat || false}
                        />
                      ) : key === "moves" ? (
                        <GameMoves
                          focus={focus}
                          game={game}
                          exploration={explorationRef.current.nodes}
                          noExplore={
                            globalMe?.settings?.all?.exploration === -1
                          }
                          handleGameMoveClick={handleGameMoveClick}
                          getFocusNode={getFocusNode}
                          handlePlaygroundExport={handlePlaygroundExport}
                          key={`Moves|colorSet${colorsChanged}`}
                        />
                      ) : key === "chat" ? (
                        <>
                          <UserChats
                            comments={
                              commentingCompletedGame
                                ? [
                                    ...(comments || []).map(c => ({ 
                                      ...c, 
                                      inGame: true,
                                      path: c.moveNumber !== undefined ? { moveNumber: c.moveNumber, exPath: [] } : undefined
                                    })),
                                    ...(allNodeComments || [])
                                  ]
                                : comments
                            }
                            players={gameRef.current?.players}
                            handleSubmit={
                              commentingCompletedGame
                                ? submitNodeComment
                                : submitComment
                            }
                            tooMuch={commentsTooLong}
                            gameid={gameRef.current?.id}
                            commentingCompletedGame={commentingCompletedGame}
                            userId={globalMe?.id}
                            handleGameMoveClick={handleGameMoveClick}
                            focusedPath={focus}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Normal, full-width layout */
            <div className="columns">
              {/***************** MoveEntry *****************/}
              <div className={`column is-one-fifth`}>
                <div style={{ marginBottom: "2rem" }} className="tourStatus">
                  <h1 className="subtitle lined">
                    <span>{t("Status")}</span>
                  </h1>
                  <GameStatus
                    status={statusRef.current}
                    settings={settings}
                    game={game}
                    canExplore={focus?.canExplore}
                    handleStashClick={handleStashClick}
                    locked={locked}
                    setLocked={setLocked}
                    setRefresh={setRefresh}
                    key={`Status|colorSet${colorsChanged}`}
                  />
                </div>
                <div className="tourMove">
                  <h1 className="subtitle lined">
                    <span>{t("MakeMove")}</span>
                  </h1>
                  <MoveEntry
                    move={move}
                    toMove={toMove}
                    game={gameRef.current}
                    engine={engineRef.current}
                    moves={movesRef.current}
                    exploration={explorationRef.current.nodes}
                    focus={focus}
                    submitting={submitting}
                    forceUndoRight={false}
                    screenWidth={screenWidth}
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
                      handleDeleteExploration,
                    ]}
                    key={`Entry|colorSet${colorsChanged}`}
                  />
                </div>
                <MiscButtons
                  metaGame={metaGame}
                  gameID={gameID}
                  toMove={toMove}
                  gameRec={gameRec}
                  canPublish={canPublish}
                  handlePublishExploration={handlePublishExploration}
                  handleExplorer={handleExplorer}
                  handleNextGame={handleNextGame}
                  explorer={explorer}
                  game={game}
                  t={t}
                />
              </div>{" "}
              {/* column */}
              {/***************** Board *****************/}
              <div className="column">
                <h1 className="subtitle lined tourWelcome">
                  <span>
                    <Link to={`/games/${metaGame}`}>
                      {gameinfo.get(metaGame).name}
                    </Link>
                    {parenthetical.length === 0 ? null : (
                      <>
                        <span
                          style={{ fontSize: "smaller", padding: 0, margin: 0 }}
                        >
                          &nbsp;(
                          {parenthetical.reduce((prev, curr) => [
                            prev,
                            ", ",
                            curr,
                          ])}
                          )
                        </span>
                      </>
                    )}
                  </span>
                </h1>
                <Board
                  metaGame={metaGame}
                  gameID={gameID}
                  t={t}
                  locked={locked}
                  setLocked={setLocked}
                  setRefresh={setRefresh}
                  gameEngine={gameEngine}
                  gameNote={gameNote}
                  inCheck={inCheck}
                  stackExpanding={gameRef.current?.stackExpanding || false}
                  increment={rotIncrement}
                  stackImage={stackImage}
                  boardImage={boardImage}
                  screenWidth={screenWidth}
                  handleRotate={handleRotate}
                  handleUpdateRenderOptions={handleUpdateRenderOptions}
                  showGameDetailsSetter={showGameDetailsSetter}
                  showGameNoteSetter={showGameNoteSetter}
                  showGameDumpSetter={showGameDumpSetter}
                  showCustomCSSSetter={showCustomCSSSetter}
                  showInjectSetter={showInjectSetter}
                  verticalLayout={verticalLayout}
                  verticalLayoutSetter={verticalLayoutSetter}
                  copyHWDiagram={copyHWDiagram}
                  colourContext={colourContext}
                  hasNewChat={gameRef.current?.hasNewChat || false}
                />
              </div>
              {/***************** GameMoves *****************/}
              <div
                className={`column is-narrow`}
                style={
                  screenWidth < 770 || verticalLayout
                    ? {}
                    : { maxWidth: "15vw" }
                }
              >
                <div className="tourMoveList">
                  <h1 className="subtitle lined">
                    <span>{t("Moves")}</span>
                  </h1>
                  <GameMoves
                    focus={focus}
                    game={game}
                    exploration={explorationRef.current.nodes}
                    noExplore={globalMe?.settings?.all?.exploration === -1}
                    handleGameMoveClick={handleGameMoveClick}
                    getFocusNode={getFocusNode}
                    handlePlaygroundExport={handlePlaygroundExport}
                    key={`Moves|colorSet${colorsChanged}`}
                  />
                </div>
                <div style={{ paddingTop: "1em" }} className="tourChat">
                  <h1 className="subtitle lined">
                    <span>{t("GameSummary")}</span>
                  </h1>
                  <UserChats
                    comments={
                      commentingCompletedGame
                        ? [
                            ...(comments || []).map(c => ({ 
                              ...c, 
                              inGame: true,
                              path: c.moveNumber !== undefined ? { moveNumber: c.moveNumber, exPath: [] } : undefined
                            })),
                            ...(allNodeComments || [])
                          ]
                        : comments
                    }
                    players={gameRef.current?.players}
                    handleSubmit={
                      commentingCompletedGame
                        ? submitNodeComment
                        : submitComment
                    }
                    tooMuch={commentsTooLong}
                    gameid={gameRef.current?.id}
                    commentingCompletedGame={commentingCompletedGame}
                    userId={globalMe?.id}
                    handleGameMoveClick={handleGameMoveClick}
                    focusedPath={focus}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="columns">
            {/* Comments */}
            <div
              className="column is-three-fifths is-offset-one-fifth"
              id="fullChatLog"
            >
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
                    t={t}
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
            show={showDeleteSubtreeConfirm}
            title={t("ConfirmDeleteSubtree")}
            buttons={[
              { label: t("Delete"), action: handleDeleteSubtreeConfirmed },
              {
                label: t("Cancel"),
                action: handleCloseDeleteSubtreeConfirm,
              },
            ]}
          >
            <div className="content">
              <p>{t("ConfirmDeleteSubtreeDesc")}</p>
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
                  (designerString === undefined
                    ? ""
                    : "\n\n" + designerString) +
                  (coderString === undefined ? "" : "\n\n" + coderString)}
              </ReactMarkdown>
              <ul className="contained">
                {gameDeets.urls.map((l, i) => (
                  <li key={`gameDeets|url|` + i}>
                    <a href={l} target="_blank" rel="noopener noreferrer">
                      {l}
                    </a>
                  </li>
                ))}
                <li key="_wiki">
                  <a
                    href={`https://abstractplay.com/wiki/doku.php?id=games:${metaGame}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abstract Play Wiki
                  </a>
                </li>
              </ul>
              {gameEngine.notes() === undefined ? (
                ""
              ) : (
                <>
                  <h2>{t("ImplementationNotes")}</h2>
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    className="content"
                  >
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
                "Download" button to save a text file to your computer, which
                you can then send to the developers. Thank you!
              </p>
              {gameRef === null ||
              gameRef.current === null ||
              gameRef.current.state === null ? (
                ""
              ) : (
                <Fragment>
                  <ClipboardCopy
                    copyText={
                      getFocusNode(
                        explorationRef.current.nodes,
                        gameRef.current,
                        focus
                      ).state
                    }
                  />
                  <div className="field">
                    <div className="control">
                      <a
                        href={`data:text/json;charset=utf-8,${encodeURIComponent(
                          getFocusNode(
                            explorationRef.current.nodes,
                            gameRef.current,
                            focus
                          ).state
                        )}`}
                        download="AbstractPlay-Debug.json"
                      >
                        <button className="button apButtonNeutral">
                          {t("Download")}
                        </button>
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
                This is a destructive function. Pasting code here will
                obliterate the existing game state and cannot be undone. You
                have been warned.
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
                  <button
                    className="button is-danger"
                    onClick={handleInjection}
                  >
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
          <Modal
            show={showCustomCSS}
            title={t("CustomCSS")}
            buttons={[
              { label: t("Save"), action: saveCustomCSS },
              {
                label: t("Cancel"),
                action: () => showCustomCSSSetter(false),
              },
            ]}
          >
            <div className="content">
              <p>
                It is possible to customize the CSS of all instances of this
                particular game.{" "}
                <strong>This is not something to do lightly!</strong> Do not
                inject code you either do not understand or have not had vetted
                by someone you trust. Abstract Play and its developers are not
                responsible for any mishaps that may occur while using this
                feature.
              </p>
              <p>
                If you are certain you wish to continue, paste the CSS code
                below and click Save. If everything blows up, open the developer
                console and clear the local storage key <code>custom-css</code>,
                and that should reset everything. See the wiki for
                documentation, and join us on Discord to discuss.
              </p>
            </div>
            <div className="control">
              <textarea
                className="textarea is-small"
                id="myCustomCSS"
                placeholder="Paste CSS code here"
                rows="5"
                value={newCSS}
                onChange={(e) => newCSSSetter(e.target.value)}
              />
            </div>
            <div className="control">
              <label className="radio">
                <input
                  type="checkbox"
                  name="activeCSS"
                  checked={cssActive}
                  onChange={(e) => cssActiveSetter(e.target.checked)}
                />
                Activate custom CSS?
              </label>
            </div>
          </Modal>
          <canvas
            id="pngExportCanvas"
            ref={canvasRef}
            style={{ display: "none" }}
          ></canvas>
        </article>
      </>
    );
  } else {
    reportError(
      `Message: ${errorMessageRef.current}, url: ${
        window.location.href
      }, game: ${JSON.stringify(game)}, state: ${
        explorationRef.current && focus
          ? getFocusNode(explorationRef.current.nodes, gameRef.current, focus)
              .state
          : ""
      }`
    );
    return <h4>{errorMessageRef.current}</h4>;
  }
}

export default GameMove;
