import { GameFactory, gameinfo } from "@abstractplay/gameslib";
import {
  applyEffectiveFlags,
  blocksExplorationAutomoveForPieEven,
} from "../effectiveGameFlags";
import {
  canExploreMove,
  getFocusNode,
  fixMoveOutcomes,
  saveLabExploration,
  restoreExplorationTree,
  isSessionExplorationBranches,
  restoreSessionExploration,
  sanitizeFocus,
  restoreMainLineAnnotations,
  normalizeSessionExploration,
  shouldReplayAlongMainLine,
  shouldExtendMainLine,
  createSpineNode,
  materializeMainLineSpineStates,
} from "./exploration";
import { resolveRenderLabels, setStatus } from "./misc";
import { GameNode } from "../../components/Lab/GameTree";
import { formatPlayerDisplayName } from "../../components/Bots/botUtils";
import { useStore } from "../../stores";
import { LAB_ME } from "./buildGame";
import { cloneDeep } from "lodash";
import { toast } from "react-toastify";
import { isPartialExplorationMove } from "../GameMove/explorationMoves";
import { buildEngineMoveResults } from "../engineMoveResults";
import { buildRenderDisplayOpts } from "../displaySettings.js";
import {
  LAB_HIDDEN_VIEW_GOD,
  labRenderExtras,
  resolveLabDisplayEngines,
} from "./hiddenView.js";

export const populateChecked = (gameRef, engineRef, t, setter) => {
  const hideSpoilers =
    useStore.getState().globalMe?.settings?.all?.hideSpoilers;
  if (hideSpoilers && !gameRef.current?.gameOver) {
    setter("");
    return;
  }
  if (gameRef.current?.canCheck) {
    const inCheckArr = engineRef.current.inCheck();
    if (inCheckArr.length > 0) {
      let newstr = "";
      for (const n of inCheckArr) {
        newstr +=
          "<p>" +
          t("InCheck", {
            player: formatPlayerDisplayName(
              gameRef.current.players[n - 1],
              useStore.getState().users
            ),
          }) +
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

export function setupLabGame(
  game0,
  gameRef,
  partialMoveRenderRef,
  renderrepSetter,
  engineRef,
  statusRef,
  movesRef,
  focusSetter,
  explorationRef,
  moveSetter,
  display,
  savedExploration = null,
  savedMoveAnnotations = null,
  initialFocus = null,
  hiddenViewMode = LAB_HIDDEN_VIEW_GOD
) {
  const explorer = true;
  void explorer;

  if (game0.state === undefined) {
    throw new Error("Lab game is missing state");
  }
  const engine = GameFactory(game0.metaGame, game0.state);
  const users = useStore.getState().users;
  const info = gameinfo.get(game0.metaGame);
  game0.name = info.name;
  applyEffectiveFlags(game0, engine, game0.metaGame);

  moveSetter({ ...engine.validateMove(""), rendered: "", move: "" });

  game0.canPie =
    game0.pie &&
    ((typeof engine.isPieTurn === "function" && engine.isPieTurn()) ||
      (typeof engine.isPieTurn !== "function" && engine.stack.length === 2)) &&
    (!Object.prototype.hasOwnProperty.call(game0, "pieInvoked") ||
      game0.pieInvoked === false);

  game0.me = 0;
  game0.variants = engine.getVariants();
  game0.canSubmit = true;
  // Local sandbox: always allow move entry and exploration (ignore no-explore flag).
  game0.canExplore = true;

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

  game0.moveResults = buildEngineMoveResults(
    engine,
    game0.players.map((p) => formatPlayerDisplayName(p, users)),
  );

  if (gameRef.current !== null && gameRef.current.colors !== undefined) {
    game0.colors = gameRef.current.colors;
  }
  gameRef.current = game0;
  partialMoveRenderRef.current = false;

  const tmpEngine = GameFactory(game0.metaGame, game0.state);
  game0.gameOver = tmpEngine.gameover;
  const winner = tmpEngine.winner;

  const history = [];
  while (true) {
    history.unshift(
      new GameNode(
        null,
        tmpEngine.lastmove ?? "",
        null,
        tmpEngine.gameover ? "" : tmpEngine.currplayer - 1
      )
    );
    if (game0.gameOver && winner.length === 1 && !game0.simultaneous) {
      history[0].outcome = winner[0] - 1;
    }
    tmpEngine.stack.pop();
    tmpEngine.gameover = false;
    tmpEngine.winner = [];
    if (tmpEngine.stack.length === 0) break;
    tmpEngine.load();
  }

  if (savedExploration) {
    const normalized = normalizeSessionExploration(history, savedExploration);
    if (
      isSessionExplorationBranches(normalized) &&
      normalized.length === history.length
    ) {
      restoreSessionExploration(
        history,
        game0.metaGame,
        gameRef.current,
        normalized
      );
    } else if (
      normalized?.length > 0 &&
      typeof normalized[0]?.move === "string"
    ) {
      restoreExplorationTree(history, game0.metaGame, game0.state, normalized);
    } else if (normalized?.length > 0) {
      restoreExplorationTree(
        history,
        game0.metaGame,
        game0.state,
        savedExploration
      );
    }
  }

  restoreMainLineAnnotations(history, savedMoveAnnotations);

  materializeMainLineSpineStates(history, game0.metaGame, game0.state);

  explorationRef.current = { gameID: game0.id, nodes: history };
  const sanitized = sanitizeFocus(
    history,
    initialFocus ?? { moveNumber: history.length - 1, exPath: [] }
  );
  const focus0 = {
    moveNumber: sanitized.moveNumber,
    exPath: sanitized.exPath,
  };
  focus0.canExplore = canExploreMove(
    gameRef.current,
    explorationRef.current.nodes,
    focus0
  );
  focusSetter(focus0);
  syncLabEngineToFocus(game0, history, focus0, {
    partialMoveRenderRef,
    engineRef,
    renderrepSetter,
    movesRef,
    moveSetter,
    statusRef,
    display,
    hiddenViewMode,
  });
}

export function renderRepForLab(
  game,
  viewEngine,
  display,
  moveOpts = {},
  hiddenViewMode = LAB_HIDDEN_VIEW_GOD
) {
  const users = useStore.getState().users;
  const renderExtras = {
    ...moveOpts,
    ...labRenderExtras(viewEngine, hiddenViewMode),
  };
  return resolveRenderLabels(
    viewEngine.render(
      buildRenderDisplayOpts(game.metaGame, display, renderExtras)
    ),
    game.players,
    users
  );
}

export function updateLabDisplay({
  game,
  fullEngine,
  hiddenViewMode,
  display,
  renderrepSetter,
  statusRef,
  partial = false,
  partialMove = "",
  moveOpts = {},
}) {
  const { viewEngine } = resolveLabDisplayEngines(
    game.metaGame,
    fullEngine,
    hiddenViewMode
  );
  const render = renderRepForLab(
    game,
    viewEngine,
    display,
    moveOpts,
    hiddenViewMode
  );
  game.stackExpanding =
    game.stackExpanding && render.renderer === "stacking-expanding";
  renderrepSetter(render);
  setStatus(viewEngine, game, partial, partialMove, statusRef.current);
}

export function syncLabEngineToFocus(
  game,
  nodes,
  focus,
  {
    partialMoveRenderRef,
    engineRef,
    renderrepSetter,
    movesRef,
    moveSetter,
    statusRef,
    display,
    hiddenViewMode = LAB_HIDDEN_VIEW_GOD,
  }
) {
  const node = getFocusNode(nodes, game, focus);
  if (!node?.state) {
    return false;
  }
  const engine = GameFactory(game.metaGame, node.state);
  partialMoveRenderRef.current = false;
  engineRef.current = engine;
  if (!game.noMoves) {
    movesRef.current = engine.moves();
  }
  updateLabDisplay({
    game,
    fullEngine: engine,
    hiddenViewMode,
    display,
    renderrepSetter,
    statusRef,
  });
  moveSetter({ ...engine.validateMove(""), move: "", rendered: "" });
  return true;
}

/** Wire move recorded on the exploration spine after a full engine apply. */
function labSpineMoveLabel(gameEngine, wire, partial) {
  if (partial) {
    return wire;
  }
  return gameEngine.lastmove ?? wire;
}

function routeLabMove(exploration, game, focus, node, gameEngineTmp, move) {
  const newfocus = cloneDeep(focus);
  let currentNode = node;

  if (shouldReplayAlongMainLine(exploration, newfocus, gameEngineTmp, move)) {
    newfocus.moveNumber += 1;
    newfocus.exPath = [];
    currentNode = getFocusNode(exploration, game, newfocus);
  } else if (shouldExtendMainLine(exploration, newfocus)) {
    exploration.push(createSpineNode(move, gameEngineTmp, game));
    newfocus.moveNumber = exploration.length - 1;
    newfocus.exPath = [];
    if (game.gameOver) fixMoveOutcomes(exploration, newfocus.moveNumber);
  } else {
    const pos = currentNode.AddChild(move, gameEngineTmp);
    if (game.gameOver) fixMoveOutcomes(exploration, newfocus.moveNumber + 1);
    newfocus.exPath.push(pos);
    currentNode = currentNode.children[pos];
  }

  return { newfocus, node: currentNode };
}

function doView(
  game,
  move,
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
  t,
  hiddenViewMode = LAB_HIDDEN_VIEW_GOD
) {
  const me = LAB_ME;
  void me;
  let node = getFocusNode(exploration, game, focus);
  let gameEngineTmp = GameFactory(game.metaGame, node.state);
  let m = move.move || "";
  const partialMove = isPartialExplorationMove(gameEngineTmp, m, {
    userCompleted: move.complete === 1,
    metaGame: game.metaGame,
  });
  const newfocus = cloneDeep(focus);
  let moves;
  try {
    gameEngineTmp.move(m, { partial: partialMove });
    if (!partialMove && !game.noMoves) {
      moves = gameEngineTmp.moves();
    }
    if (!partialMove && focus.canExplore && (game.automove || game.autopass)) {
      let automoved = false;
      while (
        moves.length === 1 &&
        (game.automove || moves[0] === "pass") &&
        !blocksExplorationAutomoveForPieEven(game, gameEngineTmp) &&
        !gameEngineTmp.__noAutomove
      ) {
        automoved = true;
        const routed = routeLabMove(
          exploration,
          game,
          newfocus,
          node,
          gameEngineTmp,
          labSpineMoveLabel(gameEngineTmp, m, partialMove)
        );
        newfocus.moveNumber = routed.newfocus.moveNumber;
        newfocus.exPath = routed.newfocus.exPath;
        node = routed.node;
        m = moves[0];
        gameEngineTmp.move(m, { partial: partialMove });
        moves = gameEngineTmp.moves();
      }
      if (automoved) {
        toast(t("AutoMoveToast"));
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
  const spineMove = labSpineMoveLabel(gameEngineTmp, m, partialMove);
  move.rendered = spineMove;
  if (!partialMove) {
    game.state = gameEngineTmp.serialize();
    const routed = routeLabMove(
      exploration,
      game,
      newfocus,
      node,
      gameEngineTmp,
      spineMove
    );
    newfocus.moveNumber = routed.newfocus.moveNumber;
    newfocus.exPath = routed.newfocus.exPath;
    newfocus.canExplore = canExploreMove(game, exploration, newfocus);
    focusSetter(newfocus);
    if (newfocus.exPath.length === 0) {
      materializeMainLineSpineStates(exploration, game.metaGame, game.state);
    }
    saveLabExploration();
    moveSetter({ ...gameEngineTmp.validateMove(""), rendered: "", move: "" });
    if (!partialMove && !game.noMoves) {
      movesRef.current = moves;
    }
  } else {
    moveSetter(move);
  }
  partialMoveRenderRef.current = partialMove;
  engineRef.current = gameEngineTmp;
  updateLabDisplay({
    game,
    fullEngine: gameEngineTmp,
    hiddenViewMode,
    display: settings?.display,
    renderrepSetter,
    statusRef,
    partial: partialMove,
    partialMove: m,
    moveOpts: move.opts,
  });
}

export function processNewMove(
  newmove,
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
  t,
  hiddenViewMode = LAB_HIDDEN_VIEW_GOD
) {
  if (
    (newmove.valid && newmove.complete > 0 && newmove.move !== "") ||
    (newmove.canrender === true &&
      (newmove.move !== "" || newmove.opts !== undefined))
  ) {
    doView(
      gameRef.current,
      newmove,
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
      t,
      hiddenViewMode
    );
  } else if (
    partialMoveRenderRef.current &&
    newmove.move !== undefined &&
    !newmove.move.startsWith(newmove.rendered)
  ) {
    const node = getFocusNode(exploration, gameRef.current, focus);
    const gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    partialMoveRenderRef.current = false;
    if (!gameRef.current.noMoves) {
      movesRef.current = gameEngineTmp.moves();
    }
    engineRef.current = gameEngineTmp;
    updateLabDisplay({
      game: gameRef.current,
      fullEngine: gameEngineTmp,
      hiddenViewMode,
      display: settings?.display,
      renderrepSetter,
      statusRef,
    });
    newmove.rendered = "";
    moveSetter(newmove);
  } else {
    moveSetter(newmove);
  }
}
