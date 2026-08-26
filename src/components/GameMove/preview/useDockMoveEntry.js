import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { GameFactory } from "@abstractplay/gameslib";
import { useStore } from "../../../stores";
import { callAuthApi } from "../../../lib/api";
import { getPendingSubmitMove } from "../../../lib/GameMove/submitMove";
import { formatPlayerDisplayName, isClientBotTurn } from "../../Bots/botUtils";
import { getFocusNode } from "./moveEntryUtils";

export function useDockMoveEntry(props) {
  const [drawoffer, drawofferSetter] = useState(false);
  const [showDrawOfferConfirm, showDrawOfferConfirmSetter] = useState(false);
  const [moveState, moveStateSetter] = useState("is-success");
  const [inputValue, inputValueSetter] = useState(props.move.move);

  const move = props.move;
  const toMove = props.toMove;
  const game = props.game;
  const moves = props.moves;
  const exploration = props.exploration;
  const focus = props.focus;
  const engine = props.engine;
  const submitting = props.submitting;
  const handleMove = props.handlers[0];
  const handleMark = props.handlers[1];
  const handleSubmit = props.handlers[2];
  const handleToSubmit = props.handlers[3];
  const handleView = props.handlers[4];
  const handleResign = props.handlers[5];
  const handleTimeOut = props.handlers[6];
  const handleReset = props.handlers[7];
  const handlePie = props.handlers[8];
  const handleDeleteExploration = props.handlers[9];
  const handlePremove = props.handlers[10];

  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const connections = useStore((state) => state.connections);

  const handleDrawOfferChange = (value, { confirmOffer = false } = {}) => {
    if (value && confirmOffer) {
      showDrawOfferConfirmSetter(true);
      return;
    }
    drawofferSetter(value);
  };

  const handleDrawOfferConfirmed = () => {
    showDrawOfferConfirmSetter(false);
    drawofferSetter(true);
  };

  const handleCloseDrawOfferConfirm = () => {
    showDrawOfferConfirmSetter(false);
  };

  const handleClear = () => {
    handleMove("");
  };

  const delayedHandleMove = useMemo(
    () =>
      debounce(
        (value) => handleMove(value),
        props.screenWidth < 770 ? 1000 : 500
      ),
    [handleMove, props.screenWidth]
  );

  const handleMoveInputChange = (value) => {
    inputValueSetter(value);
    if (/\d$/.test(value)) {
      delayedHandleMove(value);
    } else {
      delayedHandleMove.cancel();
      handleMove(value);
    }
  };

  const pingBot = useCallback(async () => {
    if (globalMe !== undefined) {
      try {
        const res = await callAuthApi("ping_bot", {
          metaGame: game.metaGame,
          gameid: game.id,
        });
        if (!res) return;
        const result = await res.json();
        if (result?.statusCode && result.statusCode !== 200) {
          console.log("Ping unsuccessful");
        }
      } catch (err) {
        console.log(err);
      }
    }
  }, [globalMe, game]);

  useEffect(() => {
    if (move.valid && move.complete === 0 && move.move.length > 0) {
      moveStateSetter("is-warning");
    } else if (
      focus?.exPath.length > 0 &&
      game.canSubmit &&
      focus?.exPath.length === 1 &&
      !submitting
    ) {
      moveStateSetter("is-warning");
    } else if (move.move.length > 0 || !move.valid) {
      moveStateSetter("is-danger");
    } else {
      moveStateSetter("is-success");
    }
  }, [move, focus, game, submitting]);

  useEffect(() => {
    inputValueSetter(move.move);
  }, [move.move]);

  if (!focus) {
    return { ready: false };
  }

  const moveToSubmit = getPendingSubmitMove(exploration, focus, {
    canSubmit: game.canSubmit,
  });

  let uiState = null;
  if (focus.moveNumber < exploration.length - 1) {
    uiState = -1;
  } else if (
    focus.moveNumber === exploration.length - 1 &&
    focus.exPath.length === 0
  ) {
    uiState = 0;
  } else {
    uiState = 1;
  }

  let mover = "";
  let img = null;
  let gameOverNonLeafNode = false;

  if (toMove !== "") {
    if (game.simultaneous) {
      if (uiState === 0) {
        if (game.canSubmit) {
          mover = t("ToMove", {
            player: formatPlayerDisplayName(game.players[game.me], allUsers),
          });
          if (game.colors !== undefined) img = game.colors[game.me];
        } else {
          mover = t("Waiting");
        }
      }
    } else {
      mover = t("ToMove", {
        player: formatPlayerDisplayName(game.players[toMove], allUsers),
      });
      if (game.colors !== undefined) img = game.colors[toMove];
      gameOverNonLeafNode =
        game.gameOver &&
        getFocusNode(exploration, game, focus)?.children?.length > 0;
    }
  } else {
    const node = getFocusNode(exploration, game, focus);
    if (!node) return { ready: false };
    const state = GameFactory(engine.metaGame, node.state);
    if (state.winner?.length > 0) {
      if (state.winner.length === 1) {
        const winner = formatPlayerDisplayName(
          game.players[state.winner[0] - 1],
          allUsers
        );
        mover = t("GameIsOver1", { winner });
      } else {
        const winners = state.winner.map((w) =>
          formatPlayerDisplayName(game.players[w - 1], allUsers)
        );
        const lastWinner = winners.pop();
        mover = t("GameIsOver2", {
          winners: winners.join(", "),
          lastWinner,
        });
      }
    } else {
      mover = t("GameIsOver");
    }
  }

  let canClaimTimeout = false;
  if (uiState === 0 && !submitting) {
    if (game.simultaneous) {
      canClaimTimeout =
        game.players.some(
          (p, i) =>
            toMove[i] &&
            i !== game.me &&
            p.time - (Date.now() - game.lastMoveTime) < 0
        ) && game.players.some((p) => p.id === globalMe?.id);
    } else {
      canClaimTimeout =
        !game.canSubmit &&
        game.toMove !== "" &&
        game.me !== game.toMove &&
        game.players.some((p) => p.id === globalMe?.id) &&
        game.players[game.toMove].time - (Date.now() - game.lastMoveTime) < 0;
    }
  }

  const drawOffered = game.players.some((p) => p.draw);
  const canDraw =
    drawOffered &&
    game.players.reduce((acc, p) => acc + (p.draw ? 1 : 0), 0) ===
      game.players.length - 1;

  const showMoveControls =
    focus.canExplore &&
    (moves === null ||
      (Array.isArray(moves) && moves.length > 0) ||
      game.customButtons);

  const showBotPing =
    uiState === 0 &&
    toMove !== "" &&
    isClientBotTurn(game, toMove, allUsers) &&
    globalMe?.admin === true;

  return {
    ready: true,
    t,
    move,
    toMove,
    game,
    moves,
    exploration,
    focus,
    engine,
    submitting,
    uiState,
    mover,
    img,
    moveToSubmit,
    canClaimTimeout,
    drawOffered,
    canDraw,
    drawoffer,
    gameOverNonLeafNode,
    moveState,
    inputValue,
    globalMe,
    connections,
    showMoveControls,
    showBotPing,
    handlers: {
      handleMove,
      handleMark,
      handleSubmit,
      handleToSubmit,
      handleView,
      handleResign,
      handleTimeOut,
      handleReset,
      handlePie,
      handleDeleteExploration,
      handlePremove,
      handleDrawOfferChange,
      handleDrawOfferConfirmed,
      handleCloseDrawOfferConfirm,
      handleClear,
      handleMoveInputChange,
      pingBot,
      getFocusNode: (exp, g, foc) => getFocusNode(exp, g, foc),
    },
    showDrawOfferConfirm,
  };
}
