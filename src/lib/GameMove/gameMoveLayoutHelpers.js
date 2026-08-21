import { gameinfo } from "@abstractplay/gameslib";
import { formatPlayerDisplayName } from "../../components/Bots/botUtils";

/**
 * Build props objects and context strings shared by beta layout shells.
 */
export function hasStatusContent(session) {
  const { game, statusRef } = session;
  const status = statusRef.current;
  if (
    !game ||
    game.colors === undefined ||
    ((!game.variants || game.variants.length === 0) &&
      status.statuses.length === 0 &&
      status.scores.length === 0 &&
      !game.playerStashes &&
      !game.sharedStash)
  ) {
    return false;
  }
  return true;
}

/** Render parenthetical meta (tournament link, unrated, etc.) without stringifying React nodes. */
export function formatParenthetical(parenthetical) {
  if (!parenthetical?.length) {
    return null;
  }
  return parenthetical.reduce((prev, curr) => [prev, ", ", curr]);
}

export function buildBoardProps(session) {
  const {
    metaGame,
    gameID,
    rendered,
    t,
    locked,
    setLocked,
    setRefresh,
    gameEngine,
    gameNote,
    inCheck,
    rotIncrement,
    stackImage,
    boardImage,
    screenWidth,
    handleRotate,
    handleUpdateRenderOptions,
    handleCycleAltDisplay,
    altDisplays,
    showGameDetailsSetter,
    showGameNoteSetter,
    showGameDumpSetter,
    showCustomCSSSetter,
    showInjectSetter,
    verticalLayout,
    verticalLayoutSetter,
    copyHWDiagram,
    colourContext,
    handleCustomize,
    boardRenderIndex,
    setBoardRenderIndex,
    watchCount,
    gameMarkProps,
    gameRef,
    handleExportBoardPng,
    showBoardExportGifSetter,
    boardExportDisabled,
  } = session;

  return {
    metaGame,
    gameID,
    rendered,
    t,
    locked,
    setLocked,
    setRefresh,
    gameEngine,
    gameNote,
    inCheck,
    stackExpanding: gameRef.current?.stackExpanding || false,
    increment: rotIncrement,
    stackImage,
    boardImage,
    screenWidth,
    handleRotate,
    handleUpdateRenderOptions,
    handleCycleAltDisplay,
    hasAltDisplays: altDisplays.length > 0,
    showGameDetailsSetter,
    showGameNoteSetter,
    showGameDumpSetter,
    showCustomCSSSetter,
    showInjectSetter,
    verticalLayout,
    verticalLayoutSetter,
    copyHWDiagram,
    colourContext,
    hasNewChat: gameRef.current?.hasNewChat || false,
    handleCustomize,
    boardRenderIndex,
    setBoardRenderIndex,
    watchCount,
    gameMarkProps,
    onExportPng: handleExportBoardPng,
    onOpenExportGif: () => showBoardExportGifSetter(true),
    boardExportDisabled: boardExportDisabled ?? rendered.length === 0,
  };
}

export function buildMoveEntryProps(session, { forceUndoRight = false } = {}) {
  const {
    move,
    toMove,
    gameRef,
    engineRef,
    movesRef,
    explorationRef,
    focus,
    submitting,
    screenWidth,
    moveEntryHandlers,
  } = session;

  return {
    move,
    toMove,
    game: gameRef.current,
    engine: engineRef.current,
    moves: movesRef.current,
    exploration: explorationRef.current.nodes,
    focus,
    submitting,
    forceUndoRight,
    screenWidth,
    handlers: moveEntryHandlers,
  };
}

export function buildMiscButtonsProps(session) {
  const {
    metaGame,
    gameID,
    toMove,
    gameRec,
    canPublish,
    handlePublishExploration,
    handleExplorer,
    handleNextGame,
    explorer,
    game,
    t,
  } = session;

  return {
    metaGame,
    gameID,
    toMove,
    gameRec,
    canPublish,
    handlePublishExploration,
    handleExplorer,
    handleNextGame,
    explorer,
    game,
    t,
  };
}

export function buildGameStatusProps(session) {
  const {
    statusRef,
    settings,
    game,
    focus,
    handleStashClick,
    locked,
    setLocked,
    setRefresh,
  } = session;

  return {
    status: statusRef.current,
    settings,
    game,
    canExplore: focus?.canExplore,
    handleStashClick,
    locked,
    setLocked,
    setRefresh,
  };
}

export function buildGameMovesProps(session) {
  const {
    focus,
    game,
    explorationRef,
    globalMe,
    handleGameMoveClick,
    getFocusNode,
    handlePlaygroundExport,
    engineRef,
    gameRec,
  } = session;

  return {
    focus,
    game,
    exploration: explorationRef.current.nodes,
    noExplore: globalMe?.settings?.all?.exploration === -1,
    handleGameMoveClick,
    getFocusNode,
    handlePlaygroundExport,
    engine: engineRef?.current,
    gameRec,
  };
}

export function buildUserChatsProps(session) {
  const {
    chatComments,
    gameRef,
    commentingCompletedGame,
    submitNodeComment,
    submitComment,
    commentsTooLong,
    canComment,
    globalMe,
    handleGameMoveClick,
    focus,
  } = session;

  return {
    comments: chatComments,
    players: gameRef.current?.players,
    handleSubmit: commentingCompletedGame ? submitNodeComment : submitComment,
    tooMuch: commentsTooLong,
    gameid: gameRef.current?.id,
    commentingCompletedGame,
    canComment,
    userId: globalMe?.id,
    handleGameMoveClick,
    focusedPath: focus,
  };
}

export function buildMoveResultsProps(session) {
  const { game, comments, gameRef, t } = session;
  return {
    className: "moveResults",
    results: game?.moveResults,
    comments,
    players: gameRef.current?.players,
    t,
  };
}

/**
 * @param {object} session
 * @param {object} users - from useStore users
 */
export function getLayoutContext(session, users, myMove, t) {
  const {
    game,
    metaGame,
    gameID,
    focus,
    explorationRef,
    toMove,
    parenthetical,
  } = session;

  const exploration = explorationRef.current?.nodes;
  const gameName = gameinfo.get(metaGame).name;
  const queueCount = Array.isArray(myMove)
    ? myMove.filter((g) => g.id !== gameID).length
    : 0;

  let lastMoveNotation = null;
  let lastMovePlayerName = null;

  if (
    exploration &&
    focus &&
    focus.exPath.length === 0 &&
    focus.moveNumber > 0
  ) {
    const node = exploration[focus.moveNumber];
    if (node?.move) {
      lastMoveNotation = node.move;
      const moverIndex = node.parent?.toMove;
      if (
        game?.players &&
        moverIndex !== undefined &&
        moverIndex !== null &&
        game.players[moverIndex]
      ) {
        lastMovePlayerName = formatPlayerDisplayName(
          game.players[moverIndex],
          users
        );
      }
    }
  }

  let myColourLabel = null;
  let myColour = null;
  if (game?.me >= 0 && game?.colors?.[game.me] !== undefined) {
    myColour = game.colors[game.me];
    myColourLabel = t("gameMove.layout.youAreColour", {
      colour: game.me + 1,
    });
  }

  return {
    gameName,
    parenthetical,
    queueCount,
    lastMoveNotation,
    lastMovePlayerName,
    myColourLabel,
    myColour,
    toMove,
    moveNumber: focus?.moveNumber ?? 0,
    isMyTurn: game?.canSubmit && game?.me === toMove,
  };
}
