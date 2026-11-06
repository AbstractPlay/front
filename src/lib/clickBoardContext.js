/**
 * @param {import('@abstractplay/gameslib').APRenderRep | null | undefined} displayRep
 * @returns {import('@abstractplay/gameslib').IClickBoardContext | undefined}
 */
export function clickBoardContextFromDisplayRep(displayRep) {
  const board = displayRep?.board;
  if (!board || board.style == null) {
    return undefined;
  }
  return {
    boardStyle: String(board.style),
    width: board.width,
    height: board.height,
  };
}

/**
 * @param {string | undefined | null} panelId
 * @param {import('@abstractplay/gameslib').IClickBoardContext | undefined} board
 * @param {string | undefined} inputMode
 * @returns {import('@abstractplay/gameslib').IHandleClickUi | undefined}
 */
export function buildHandleClickUi(panelId, board, inputMode) {
  const hasPanel = panelId != null && panelId !== "";
  const hasInputMode =
    inputMode !== undefined &&
    inputMode !== null &&
    String(inputMode) !== "";
  if (!hasPanel && board == null && !hasInputMode) {
    return undefined;
  }
  return {
    ...(hasPanel ? { panelId: String(panelId) } : {}),
    ...(board != null ? { board } : {}),
    ...(hasInputMode ? { inputMode: String(inputMode) } : {}),
  };
}
