import { GameFactory, gameinfo } from "@abstractplay/gameslib";
import { isExplorer, canExploreMove, setCanPublish, setURL, getFocusNode, fixMoveOutcomes, saveExploration } from "./exploration";
import { replaceNames, setStatus } from "./misc";
import { GameNode } from "../../components/GameMove/GameTree";
import { cloneDeep } from "lodash";
import { toast } from "react-toastify";

export function setupGame(
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
  game0.autopass = info.flags !== undefined && info.flags.includes("autopass");
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
  engineRef.current = engine.clone();
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

  // If the game is over and gameEnded is not set, calculate it from the last move's timestamp
  if (game0.gameOver && !game0.gameEnded && tmpEngine.stack.length > 0) {
    const lastMove = tmpEngine.stack[tmpEngine.stack.length - 1];
    if (lastMove && lastMove._timestamp) {
      game0.gameEnded = new Date(lastMove._timestamp).getTime();
    }
  }
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
  let m = move.move || "";
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
    // check for auto moves (automove: any forced move; autopass: only forced pass)
    if (
      !partialMove &&
      focus.canExplore &&
      (game.automove || game.autopass) &&
      isExplorer(explorer, me)
    ) {
      let automoved = false;
      // Don't auto move through pie offer in a non-Playground game.
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

export function processNewMove(
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
    newmove.move !== undefined &&
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

export const populateChecked = (gameRef, engineRef, t, setter) => {
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
