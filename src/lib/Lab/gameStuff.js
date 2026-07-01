import { GameFactory, gameinfo } from "@abstractplay/gameslib";
import {
  canExploreMove,
  getFocusNode,
  fixMoveOutcomes,
  saveLabExploration,
  restoreExplorationTree,
  serializeSessionExploration,
  isSessionExplorationBranches,
  restoreSessionExploration,
  sanitizeFocus,
} from "./exploration";
import { replaceNames, setStatus } from "./misc";
import { GameNode } from "../../components/Lab/GameTree";
import { formatPlayerDisplayName } from "../../components/Bots/botUtils";
import { useStore } from "../../stores";
import { LAB_ME } from "./buildGame";
import { cloneDeep } from "lodash";
import { toast } from "react-toastify";

export const populateChecked = (gameRef, engineRef, t, setter) => {
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
  initialFocus = null
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
  game0.playerStashes =
    info.flags !== undefined && info.flags.includes("player-stashes");
  game0.sharedStash =
    info.flags !== undefined && info.flags.includes("shared-stash");
  game0.noMoves = info.flags !== undefined && info.flags.includes("no-moves");
  game0.automove = info.flags !== undefined && info.flags.includes("automove");
  game0.autopass = info.flags !== undefined && info.flags.includes("autopass");
  game0.noExploreFlag =
    info.flags !== undefined && info.flags.includes("no-explore");
  game0.stackExpanding =
    info.flags !== undefined && info.flags.includes("stacking-expanding");

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

  if (typeof engine.chatLog === "function") {
    game0.moveResults = engine
      .chatLog(game0.players.map((p) => formatPlayerDisplayName(p, users)))
      .map((e, idx) => ({ time: e[0], log: e.slice(1).join(" "), ply: idx + 1 }))
      .reverse();
  } else {
    game0.moveResults = engine.resultsHistory().reverse();
  }

  if (gameRef.current !== null && gameRef.current.colors !== undefined) {
    game0.colors = gameRef.current.colors;
  }
  gameRef.current = game0;
  partialMoveRenderRef.current = false;
  engineRef.current = engine.clone();

  const render = replaceNames(
    engine.render({ perspective: engine.currplayer, altDisplay: display }),
    game0.players,
    users
  );
  game0.stackExpanding =
    game0.stackExpanding && render.renderer === "stacking-expanding";
  setStatus(engine, game0, false, "", statusRef.current);

  if (!game0.noMoves) {
    movesRef.current = engine.moves();
  }

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
    if (
      game0.gameOver &&
      winner.length === 1 &&
      !game0.simultaneous
    ) {
      history[0].outcome = winner[0] - 1;
    }
    tmpEngine.stack.pop();
    tmpEngine.gameover = false;
    tmpEngine.winner = [];
    if (tmpEngine.stack.length === 0) break;
    tmpEngine.load();
  }

  if (savedExploration) {
    if (
      isSessionExplorationBranches(savedExploration) &&
      savedExploration.length === history.length
    ) {
      restoreSessionExploration(
        history,
        game0.metaGame,
        gameRef.current,
        savedExploration
      );
    } else if (savedExploration.length > 0) {
      restoreExplorationTree(
        history,
        game0.metaGame,
        game0.state,
        savedExploration
      );
    }
  }

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
  renderrepSetter(render);
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
  settings
) {
  const me = LAB_ME;
  void me;
  let node = getFocusNode(exploration, game, focus);
  let gameEngineTmp = GameFactory(game.metaGame, node.state);
  let partialMove = false;
  if (move.valid && move.complete < 1 && move.canrender === true) {
    partialMove = true;
  }
  const m = move.move || "";
  const newfocus = cloneDeep(focus);
  let moves;
  try {
    gameEngineTmp.move(m, { partial: partialMove });
    if (!partialMove && !game.noMoves) {
      moves = gameEngineTmp.moves();
    }
    if (
      !partialMove &&
      focus.canExplore &&
      (game.automove || game.autopass)
    ) {
      let automoved = false;
      while (
        moves.length === 1 &&
        (game.automove || moves[0] === "pass") &&
        !(
          game.pieEven &&
          ((typeof gameEngineTmp.shouldOfferPie === "function" &&
            gameEngineTmp.shouldOfferPie()) ||
            (typeof gameEngineTmp.shouldOfferPie !== "function" &&
              gameEngineTmp.state().stack.length === 2))
        ) &&
        !gameEngineTmp.__noAutomove
      ) {
        automoved = true;
        const nextMain = exploration[newfocus.moveNumber + 1];
        if (
          !game.gameOver ||
          !nextMain ||
          !gameEngineTmp.sameMove(m, nextMain.move)
        ) {
          const pos = node.AddChild(m, gameEngineTmp);
          newfocus.exPath.push(pos);
          node = node.children[pos];
        } else {
          newfocus.moveNumber = newfocus.moveNumber + 1;
          newfocus.exPath = [];
          node = getFocusNode(exploration, game, newfocus);
        }
        m = moves[0];
        gameEngineTmp.move(m, { partial: partialMove });
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
      errorMessageRef.current = err.client;
    } else {
      errorMessageRef.current = err.message;
    }
    errorSetter(true);
    return;
  }
  move.rendered = m;
  setStatus(gameEngineTmp, game, partialMove, m, statusRef.current);
  if (!partialMove) {
    const nextMain = exploration[newfocus.moveNumber + 1];
    const advanceAlongMainLine =
      game.gameOver &&
      newfocus.exPath.length === 0 &&
      newfocus.moveNumber < exploration.length - 1 &&
      nextMain &&
      gameEngineTmp.sameMove(m, nextMain.move);

    if (!advanceAlongMainLine) {
      const pos = node.AddChild(m, gameEngineTmp);
      if (game.gameOver) fixMoveOutcomes(exploration, newfocus.moveNumber + 1);
      newfocus.exPath.push(pos);
      saveLabExploration();
    } else {
      newfocus.moveNumber = newfocus.moveNumber + 1;
      newfocus.exPath = [];
    }
    newfocus.canExplore = canExploreMove(game, exploration, newfocus);
    focusSetter(newfocus);
    moveSetter({ ...gameEngineTmp.validateMove(""), rendered: "", move: "" });
    if (!partialMove && !game.noMoves) {
      movesRef.current = moves;
    }
  } else {
    moveSetter(move);
  }
  partialMoveRenderRef.current = partialMove;
  engineRef.current = gameEngineTmp;
  renderrepSetter(
    replaceNames(
      gameEngineTmp.render({
        perspective: gameEngineTmp.currplayer,
        altDisplay: settings?.display,
        ...move.opts,
      }),
      game.players,
      useStore.getState().users
    )
  );
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
  settings
) {
  if (
    (newmove.valid && newmove.complete > 0 && newmove.move !== "") ||
    newmove.canrender === true
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
      settings
    );
  } else if (
    partialMoveRenderRef.current &&
    newmove.move !== undefined &&
    !newmove.move.startsWith(newmove.rendered)
  ) {
    const node = getFocusNode(exploration, gameRef.current, focus);
    const gameEngineTmp = GameFactory(gameRef.current.metaGame, node.state);
    partialMoveRenderRef.current = false;
    setStatus(gameEngineTmp, gameRef.current, false, "", statusRef.current);
    if (!gameRef.current.noMoves) {
      movesRef.current = gameEngineTmp.moves();
    }
    engineRef.current = gameEngineTmp;
    renderrepSetter(
      replaceNames(
        gameEngineTmp.render({
          perspective: gameEngineTmp.currplayer,
          altDisplay: settings?.display,
        }),
        gameRef.current.players,
        useStore.getState().users
      )
    );
    newmove.rendered = "";
    moveSetter(newmove);
  } else {
    moveSetter(newmove);
  }
}
