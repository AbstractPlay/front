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
 * @returns {import('@abstractplay/gameslib').IHandleClickUi | undefined}
 */
export function buildHandleClickUi(panelId, board) {
  const hasPanel = panelId != null && panelId !== "";
  if (!hasPanel && board == null) {
    return undefined;
  }
  return {
    ...(hasPanel ? { panelId: String(panelId) } : {}),
    ...(board != null ? { board } : {}),
  };
}
