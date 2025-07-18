import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useContext,
} from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypeRaw from "rehype-raw";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { render, renderglyph } from "@abstractplay/renderer";
import { Auth } from "aws-amplify";
import { cloneDeep } from "lodash";
import { API_ENDPOINT_AUTH } from "../config";
import { GameNode } from "./Playground/GameTree";
import { Helmet } from "react-helmet-async";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import GameMoves from "./Playground/GameMoves";
import GameStatus from "./Playground/GameStatus";
import MoveEntry from "./Playground/MoveEntry";
// import RenderOptionsModal from "./RenderOptionsModal";
import Modal from "./Modal";
import ClipboardCopy from "./Playground/ClipboardCopy";
import { MeContext, ColourContext } from "../pages/Skeleton";
import GameVariants from "./GameVariants";

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
  return true;
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
  game0.customRandom =
    info.flags !== undefined && info.flags.includes("custom-randomization");
  game0.automove = info.flags !== undefined && info.flags.includes("automove");
  game0.stackExpanding =
    info.flags !== undefined && info.flags.includes("stacking-expanding");
  moveSetter({ ...engine.validateMove(""), rendered: "", move: "" });
  // eslint-disable-next-line no-prototype-builtins
  game0.canPie =
    game0.pie &&
    ((typeof engine.isPieTurn === "function" && engine.isPieTurn()) ||
      (typeof engine.isPieTurn !== "function" && engine.stack.length === 2)) &&
    // eslint-disable-next-line no-prototype-builtins
    (!game0.hasOwnProperty("pieInvoked") || (game0.pieInvoked = false));
  game0.me = 0; //game0.players.findIndex((p) => me && p.id === me.id);
  game0.variants = engine.getVariants();

  game0.canSubmit = true; // game0.toMove !== "" && me && game0.players[game0.toMove].id === me.id;
  game0.canExplore = true; //game0.numPlayers === 2 && isExplorer(explorer, me);
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
  //   if (typeof engine.chatLog === "function") {
  //     game0.moveResults = engine
  //       .chatLog(game0.players.map((p) => p.name))
  //       .reverse()
  //       .map((e) => {
  //         return { time: e[0], log: e.slice(1).join(" ") };
  //       });
  //   } else {
  //     game0.moveResults = engine.resultsHistory().reverse();
  //   }
  if (gameRef.current !== null && gameRef.current.colors !== undefined)
    game0.colors = gameRef.current.colors; // gets used when you submit a move.
  gameRef.current = game0;
  partialMoveRenderRef.current = false;
  engineRef.current = cloneDeep(engine);
  const render = engine.render({
    perspective: engine.currplayer,
    altDisplay: display,
  });
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

  // If the game is  over, generate the game record
  // TODO: Add "eve nt" and "round" should those ever be implemented.
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
  while (true) {
    history.unshift(
      new GameNode(
        null,
        engine.lastmove,
        engine.cheapSerialize(),
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
  focusSetter(focus0);
  renderrepSetter(render);
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
  game.colors = [1, 2].map((p, i) => {
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
  if (!isExplorer(explorer, me)) return;
  if (!game.gameOver) {
    if (moveNumber !== exploration.length)
      throw new Error("Can't save exploration at this move!");
  }
  let pars = {
    public: game.gameOver,
    game: me.id, //game.id,
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
  //   console.log(`EXPLORATION REF:`, explorationRef.current);
  partialMoveRenderRef.current = partialMove;
  // console.log('setting renderrep 1');
  engineRef.current = gameEngineTmp;
  renderrepSetter(
    gameEngineTmp.render({
      perspective: gameEngineTmp.currplayer,
      altDisplay: settings?.display,
      ...move.opts,
    })
  );
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
      gameEngineTmp.render({
        perspective: gameEngineTmp.currplayer,
        altDisplay: settings?.display,
      })
    );
    newmove.rendered = "";
    moveSetter(newmove);
  } else {
    moveSetter(newmove); // not renderable yet
  }
}

const populateChecked = (gameRef, engineRef, t, setter) => {
  setter("");
  //   if (gameRef.current?.canCheck) {
  //     const inCheckArr = engineRef.current.inCheck();
  //     if (inCheckArr.length > 0) {
  //       let newstr = "";
  //       for (const n of inCheckArr) {
  //         newstr +=
  //           "<p>" +
  //           t("InCheck", { player: gameRef.current.players[n - 1].name }) +
  //           "</p>";
  //       }
  //       setter(newstr);
  //     } else {
  //       setter("");
  //     }
  //   } else {
  //     setter("");
  //   }
};

function Playground(props) {
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
  //   const [showSettings, showSettingsSetter] = useState(false);
  const [showDeleteSubtreeConfirm, showDeleteSubtreeConfirmSetter] =
    useState(false);
  const [showGameDetails, showGameDetailsSetter] = useState(false);
  const [showGameDump, showGameDumpSetter] = useState(false);
  const [userSettings, userSettingsSetter] = useState();
  const [gameSettings, gameSettingsSetter] = useState();
  const [settings, settingsSetter] = useState(null);
  const [submitting] = useState(false);
  const [newGame, newGameSetter] = useState("");
  const [selectedVariants, selectedVariantsSetter] = useState([]);
  const [validGames, validGamesSetter] = useState([]);
  const [explorationFetched, explorationFetchedSetter] = useState(false);
  const [globalMe] = useContext(MeContext);
  const [colourContext] = useContext(ColourContext);
  const [, gameRecSetter] = useState(undefined);
  const [explorer, explorerSetter] = useState(true); // just whether the user clicked on the explore button. Also see isExplorer.
  // pieInvoked is used to trigger the game reload after the function is called
  const [pieInvoked] = useState(false);
  // used to construct the localized string of players in check
  const [inCheck, inCheckSetter] = useState("");
  const [, canPublishSetter] = useState("no");
  const [metaGame, metaGameSetter] = useState(null);
  const [gameID, gameIDSetter] = useState(null);
  const [gameEngine, gameEngineSetter] = useState(null);
  const [gameDeets, gameDeetsSetter] = useState(null);
  const [designerString, designerStringSetter] = useState("");
  const [coderString, coderStringSetter] = useState("");
  const [screenWidth, screenWidthSetter] = useState(window.innerWidth);
  const errorMessageRef = useRef("");
  const movesRef = useRef(null);
  const statusRef = useRef({});
  const [colorsChanged, colorsChangedSetter] = useState(0);
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
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  //   const { state } = useLocation();

  const handleResize = () => {
    screenWidthSetter(window.innerWidth);
  };
  window.addEventListener("resize", handleResize);

  useEffect(() => {
    if (metaGame !== null && metaGame !== undefined) {
      const info = gameinfo.get(metaGame);
      gameDeetsSetter(info);
      if (info !== undefined) {
        if (info.playercounts.length > 1) {
          gameEngineSetter(GameFactory(info.uid, 2));
        } else {
          gameEngineSetter(GameFactory(info.uid));
        }
        // eslint-disable-next-line no-prototype-builtins
        if (info.hasOwnProperty("people")) {
          let str = "";
          let designers = info.people
            .filter((p) => p.type === "designer")
            .map((p) => {
              if ("urls" in p && p.urls !== undefined && p.urls.length > 0) {
                let str = `[${p.name}](${p.urls[0]})`;
                if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
                  str += ` [(AP)](/player/${p.apid})`;
                }
                return str;
              } else if (
                "apid" in p &&
                p.apid !== undefined &&
                p.apid.length > 0
              ) {
                return `[${p.name}](/player/${p.apid})`;
              } else {
                return p.name;
              }
            });
          if (designers.length === 1) {
            str = "Designer: ";
          } else {
            str = "Designers: ";
          }
          str += designers.join(", ");
          designerStringSetter(str);

          str = "";
          let coders = info.people
            .filter((p) => p.type === "coder")
            .map((p) => {
              if ("urls" in p && p.urls !== undefined && p.urls.length > 0) {
                let str = `[${p.name}](${p.urls[0]})`;
                if ("apid" in p && p.apid !== undefined && p.apid.length > 0) {
                  str += ` [(AP)](/player/${p.apid})`;
                }
                return str;
              } else if (
                "apid" in p &&
                p.apid !== undefined &&
                p.apid.length > 0
              ) {
                return `[${p.name}](/player/${p.apid})`;
              } else {
                return p.name;
              }
            });
          if (designers.length === 1) {
            str = "Coder: ";
          } else {
            str = "Coders: ";
          }
          str += coders.join(", ");
          coderStringSetter(str);
        }
      }
    }
  }, [metaGame, gameDeets]);

  useEffect(() => {
    let lst = [];
    for (const info of gameinfo.values()) {
      if (
        info.playercounts.includes(2) &&
        !info.flags.includes("simultaneous")
      ) {
        lst.push([info.uid, info.name]);
      }
    }
    if (process.env.REACT_APP_REAL_MODE === "production") {
      lst = lst.filter(
        (id) => !gameinfo.get(id[0]).flags.includes("experimental")
      );
    }
    lst.sort((a, b) => a[1].localeCompare(b[1]));
    validGamesSetter(lst);
  }, []);

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
    if (globalMe !== null && globalMe !== undefined) {
      gameIDSetter(globalMe.id);
    } else {
      gameIDSetter(null);
    }
  }, [globalMe]);

  useEffect(() => {
    console.log("Fetching playground data");
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
              query: "get_playground",
              pars: {},
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
            if (data !== null) {
              metaGameSetter(data.metaGame);
            } else {
              metaGameSetter(null);
            }
          }
        } else {
          errorMessageRef.current =
            "You must be logged in to access your playground.";
          errorSetter(true);
          metaGameSetter(null);
        }
        if (status === 200) {
          if (metaGame !== null && metaGame !== undefined) {
            console.log("playground fetched:", data);
            setupGame(
              data,
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
              {},
              globalMe?.settings,
              gameRef,
              settingsSetter,
              gameSettingsSetter,
              userSettingsSetter,
              globalMe,
              colourContext
            );
            populateChecked(gameRef, engineRef, t, inCheckSetter);
          }
        }
      } catch (error) {
        console.log(error);
        errorMessageRef.current = error.message;
        errorSetter(true);
      }
    }
    // Somehow react loses track of this, so explicitly remove this.
    if (boardImage.current !== null && boardImage.current !== undefined) {
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
    t,
    navigate,
    colourContext,
  ]);

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

    if (focus && !explorationFetched && gameRef.current.canExplore) {
      fetchPrivateExploration();
    }
  }, [focus, explorationFetched, gameID, explorer, globalMe]);

  const handleChangeGame = (game) => {
    if (game === "") {
      newGameSetter("");
    } else {
      newGameSetter(game);
    }
    errorSetter("");
  };

  useEffect(() => {
    console.log("Selected Variants:", selectedVariants);
  }, [selectedVariants]);

  const handleInitPlayground = async () => {
    if (newGame === null || newGame === undefined || newGame === "") {
      errorSetter(t("SelectAGame"));
      return;
    }
    try {
      const info = gameinfo.get(newGame);
      if (info === undefined) {
        throw new Error(`Could not load game information for ${newGame}`);
      }
      let g;
      if (info.playercounts.length > 1) {
        g = GameFactory(newGame, 2, selectedVariants);
      } else {
        g = GameFactory(newGame, undefined, selectedVariants);
      }
      if (g !== undefined) {
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
              metaGame: newGame,
              state: g.serialize(),
            },
          }),
        });
        if (res.status !== 200) {
          const result = await res.json();
          errorMessageRef.current = JSON.parse(result.body);
          errorSetter(true);
        } else {
          const result = await res.json();
          const data = JSON.parse(result.body);
          console.log(`INIT PLAYGROUND`);
          console.log(data);
          metaGameSetter(newGame);
          setupGame(
            data,
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
            {},
            globalMe?.settings,
            gameRef,
            settingsSetter,
            gameSettingsSetter,
            userSettingsSetter,
            globalMe,
            colourContext
          );
          populateChecked(gameRef, engineRef, t, inCheckSetter);
        }
      } else {
        errorSetter(
          `Could not instantiate the game ${newGame} with variants ${JSON.stringify(
            selectedVariants
          )}`
        );
      }
    } catch (error) {
      console.log(`Fatal error caught: ${error}`);
      errorSetter(error);
    }
  };

  const handleResetPlayground = async () => {
    const usr = await Auth.currentAuthenticatedUser();
    const token = usr.signInUserSession.idToken.jwtToken;
    try {
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
            query: "reset_playground",
            pars: {},
          }),
        });
        status = res.status;
        if (status !== 200) {
          const result = await res.json();
          errorMessageRef.current = JSON.parse(result.body);
          console.log(`Status code was not 200: ${JSON.parse(result.body)}`);
          errorSetter(true);
        } else {
          metaGameSetter(null);
          errorSetter(false);
        }
      } else {
        errorMessageRef.current =
          "You must be logged in to access your playground.";
        errorSetter(true);
        metaGameSetter(null);
      }
    } catch (error) {
      console.log(error);
      errorMessageRef.current = error.message;
      errorSetter(true);
    }
    // Somehow react loses track of this, so explicitly remove this.
    if (boardImage.current !== null && boardImage.current !== undefined) {
      const svg = boardImage.current.querySelector("svg");
      if (svg !== null) {
        svg.remove();
      }
    }
  };

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
    renderrepSetter(
      engine.render({
        perspective: engine.currplayer,
        altDisplay: settings?.display,
      })
    );
    const isPartialSimMove =
      gameRef.current.simultaneous &&
      (foc.exPath.length === 1 ||
        (foc.exPath.length === 0 &&
          foc.moveNumber === explorationRef.current.length - 1 &&
          !gameRef.current.canSubmit));
    setStatus(engine, gameRef.current, isPartialSimMove, "", statusRef.current);
    moveSetter({ ...engine.validateMove(""), move: "", rendered: "" });
    const metaInfo = gameinfo.get(game.metaGame);
    if (metaInfo.flags.includes("custom-colours")) {
      setupColors(settings, gameRef.current, globalMe, colourContext, node);
      colorsChangedSetter((val) => val + 1);
    }
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
      //   console.log(`boardClick:(${row},${col},${piece})`);
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
      //   console.log(result);
      result.rendered = moveRef.current.rendered;
      //   console.log(moveRef.current.rendered);
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

    if (boardImage.current !== null && boardImage.current !== undefined) {
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
        if (settings.color !== "standard" && settings.color !== "blind") {
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
              options.colours.splice(game.me,0,mycolor);
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
    colourContext,
  ]);

  useEffect(() => {
    colorsChangedSetter((val) => val + 1);
  }, [colourContext]);

  //   const setError = (error) => {
  //     if (error.Message !== undefined) errorMessageRef.current = error.Message;
  //     else errorMessageRef.current = JSON.stringify(error);
  //     errorSetter(true);
  //   };

  //   const handleUpdateRenderOptions = () => {
  //     showSettingsSetter(true);
  //   };

  useEffect(() => {
    /**
     * Takes the current renderrep and deduces the correct minimum rotation increment.
     * A value of 0 means the board may not be rotated.
     */
    const getRotationIncrement = (metaGame, rep, engine, game) => {
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
    if (
      renderrep !== null &&
      engineRef.current !== null &&
      gameRef.current !== null
    ) {
      gameRef.current.increment = getRotationIncrement(
        metaGame,
        renderrep,
        engineRef.current,
        gameRef.current
      );
      console.log(`Rotation increment: ${gameRef.current.increment}`);
    }
  }, [renderrep, metaGame]);

  const handleRotate = async (dir) => {
    let newGameSettings = cloneDeep(gameSettings);
    if (newGameSettings === undefined) newGameSettings = {};
    let rotate = newGameSettings.rotate;
    if (rotate === undefined) rotate = 0;
    let increment = 0;
    if (gameRef.current !== null && gameRef.current.increment !== undefined) {
      increment = gameRef.current.increment;
    }
    if (dir === "CW") {
      rotate += increment;
    } else {
      rotate -= increment;
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
  };

  //   const processUpdatedSettings = (newGameSettings, newUserSettings) => {
  //     console.log("processUpdatedSettings", newGameSettings, newUserSettings);
  //     const newSettings = processNewSettings(
  //       newGameSettings,
  //       newUserSettings,
  //       gameRef,
  //       settingsSetter,
  //       gameSettingsSetter,
  //       userSettingsSetter
  //     );
  //     if (newSettings?.display) {
  //       console.log("settings.display", newSettings.display);
  //       const newRenderRep =
  //         engineRef.current.render({
  //           perspective: gameRef.current.me + 1,
  //           altDisplay: newSettings.display,
  //         });
  //       renderrepSetter(newRenderRep);
  //       gameRef.current.stackExpanding =
  //         newRenderRep.renderer === "stacking-expanding";
  //     }
  //   };

  //   const handleSettingsClose = () => {
  //     showSettingsSetter(false);
  //   };

  //   const handleSettingsSave = () => {
  //     showSettingsSetter(false);
  //   };

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

  const handleDeleteExploration = () => {
    if (getFocusNode(explorationRef.current, focus).children.length > 0) {
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
    let node = getFocusNode(explorationRef.current, focus);
    node.DeleteNode();
    let foc = cloneDeep(focus);
    foc.exPath.pop();
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
      foc,
      navigate
    );
    handleGameMoveClick(foc);
  };

  const game = gameRef.current;
  // console.log("rendering at focus ", focus);
  // console.log("game.me", game ? game.me : "nope");
  if (!error && metaGame === null) {
    return (
      <>
        <div className="content">
          <p>
            Welcome to your playground. This is a private place where you can
            explore most of the games available on the site, and you can import
            existing games here as well.
          </p>
          <p>
            To start a new game, use the form below. To import an existing game,
            find the game and click the "Export to playground" button below the
            move list after navigating to the move you want to start from.
          </p>
          <p>
            The playground uses the built-in exploration features, which do have
            some limits. The playground only supports 2-player non-simultaneous
            games.
          </p>
        </div>
        <hr />
        <div className="field">
          <label className="label" htmlFor="gameSelect">
            Select a game
          </label>
          <div className="control">
            <div className="select">
              <select
                id="gameSelect"
                onChange={(e) => handleChangeGame(e.target.value)}
              >
                <option value=""></option>
                {validGames.map(([uid, name], i) => {
                  return (
                    <option value={uid} key={`validGames|${i}`}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <p className="help">
            Simultaneous games have been removed from the list.
          </p>
        </div>
        <GameVariants
          metaGame={newGame}
          variantsSetter={selectedVariantsSetter}
        />
        <div className="field">
          <div className="control">
            <button className="button apButton" onClick={handleInitPlayground}>
              Explore game
            </button>
          </div>
        </div>
      </>
    );
  } else if (!error && metaGame !== null) {
    let toMove;
    if (focus) {
      toMove = getFocusNode(explorationRef.current, focus).toMove;
    }

    return (
      <>
        <Helmet>
          <meta property="og:title" content={`Single-Player Playground`} />
          <meta
            property="og:url"
            content={`https://play.abstractplay.com/playground`}
          />
          <meta
            property="og:description"
            content={`A place for users to experiment with and learn games (excludes simultaneous games and games requiring 3+ players)`}
          />
        </Helmet>
        <article>
          <div className="columns">
            {/***************** MoveEntry *****************/}
            <div className={`column is-one-fifth`}>
              <GameStatus
                status={statusRef.current}
                settings={settings}
                game={game}
                canExplore={focus?.canExplore}
                handleStashClick={handleStashClick}
                key={`Status|colorSet${colorsChanged}`}
              />
              <MoveEntry
                move={move}
                toMove={toMove}
                game={gameRef.current}
                moves={movesRef.current}
                engine={engineRef.current}
                exploration={explorationRef.current}
                focus={focus}
                submitting={submitting}
                handlers={[
                  handleMove,
                  handleMark,
                  handleView,
                  handleReset,
                  handleDeleteExploration,
                ]}
                key={`Entry|colorSet${colorsChanged}`}
              />
              <div className="buttons">
                {/* Ended up not needing any of the buttons in this area,
                    like Next Game and Explore */}
              </div>
            </div>
            {/***************** Board *****************/}
            <div className="column">
              <h1 className="subtitle lined">
                <span>
                  {gameDeets?.name}
                  <span style={{ fontSize: "smaller", padding: 0, margin: 0 }}>
                    {" (playground)"}
                  </span>
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
              <TransformWrapper
                doubleClick={{ disabled: true }}
                centerOnInit={false}
                disabled={screenWidth < 770}
              >
                <TransformComponent>
                  {gameRef.current?.stackExpanding ? (
                    <div
                      className={`board _meta_${metaGame}`}
                      style={{ backgroundColor: colourContext.background }}
                    >
                      <div className="stack" id="stack" ref={stackImage}></div>
                      <div
                        className="stackboard"
                        id="svg"
                        ref={boardImage}
                      ></div>
                    </div>
                  ) : (
                    <div
                      className={`board tourBoard _meta_${metaGame}`}
                      style={{ backgroundColor: colourContext.background }}
                      id="svg"
                      ref={boardImage}
                    ></div>
                  )}
                </TransformComponent>
              </TransformWrapper>
              <div className="boardButtons">
                {gameRef === undefined ||
                gameRef === null ||
                gameRef.current === undefined ||
                gameRef.current === null ||
                gameRef.current.increment === undefined ||
                gameRef.current.increment === null ||
                gameRef.current.increment === 0 ? null : (
                  <>
                    <button
                      className="fabtn align-right"
                      onClick={() => handleRotate("CW")}
                      title={t("RotateBoardCW")}
                    >
                      <i className="fa fa-repeat"></i>
                    </button>
                    <button
                      className="fabtn align-right"
                      onClick={() => handleRotate("CCW")}
                      title={t("RotateBoardCCW")}
                    >
                      <i className="fa fa-undo"></i>
                    </button>
                  </>
                )}
                {/* <button
                className="fabtn align-right"
                onClick={handleUpdateRenderOptions}
                title={t("BoardSettings")}
              >
                <i className="fa fa-cog"></i>
              </button> */}
                <button
                  className="fabtn align-right"
                  onClick={() => {
                    showGameDetailsSetter(true);
                  }}
                  title={t("GameInfo")}
                >
                  {gameEngine === undefined ||
                  gameEngine === null ||
                  gameEngine.notes() === undefined ? (
                    <i className="fa fa-info"></i>
                  ) : (
                    <span className="highlight">
                      <i className="fa fa-info"></i>
                    </span>
                  )}
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
              </div>
            </div>
            {/***************** GameMoves *****************/}
            <div
              className={`column is-narrow`}
              style={screenWidth < 770 ? {} : { maxWidth: "15vw" }}
            >
              <GameMoves
                focus={focus}
                game={game}
                exploration={explorationRef.current}
                handleGameMoveClick={handleGameMoveClick}
                key={`Moves|colorSet${colorsChanged}`}
              />
            </div>
          </div>
          <div className="control">
            <button className="button apButton" onClick={handleResetPlayground}>
              Reset Playground
            </button>
          </div>

          {/* columns */}
          {/* <RenderOptionsModal
          show={showSettings}
          game={game}
          settings={userSettings}
          gameSettings={gameSettings}
          processNewSettings={processUpdatedSettings}
          showSettingsSetter={showSettingsSetter}
          setError={setError}
          handleClose={handleSettingsClose}
          handleSave={handleSettingsSave}
        /> */}
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
            show={showGameDetails}
            title={t("GameInfoFor", { metaGame: gameDeets?.name })}
            buttons={[
              {
                label: t("Close"),
                action: () => {
                  showGameDetailsSetter(false);
                },
              },
            ]}
          >
            {gameEngine === undefined || gameEngine === null ? null : (
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
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      className="content"
                    >
                      {gameEngine.notes()}
                    </ReactMarkdown>
                  </>
                )}
              </div>
            )}
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
          <canvas
            id="pngExportCanvas"
            ref={canvasRef}
            style={{ display: "none" }}
          ></canvas>
        </article>
      </>
    );
  } else {
    return (
      <>
        <h4>{errorMessageRef.current}</h4>
        <div className="control">
          <button className="button apButton" onClick={handleResetPlayground}>
            Reset Playground
          </button>
        </div>
      </>
    );
  }
}

export default Playground;
