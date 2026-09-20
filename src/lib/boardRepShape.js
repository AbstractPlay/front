/** Board styles that must not be swapped via customization (mirrors renderer registry). */
export const NON_SWAPPABLE_BOARD_STYLES = new Set([
  "squares-diamonds",
  "pegboard",
  "vertex-fanorona",
]);

/**
 * @param {import('@abstractplay/gameslib').APRenderRep['board'] | undefined} board
 */
export function isBoardBasicBoard(board) {
  if (board == null || typeof board !== "object") {
    return false;
  }
  return "style" in board && typeof board.style === "string";
}

/**
 * @param {import('@abstractplay/gameslib').APRenderRep} rep
 */
export function isBoardStyleSwappable(rep) {
  if (!isBoardBasicBoard(rep.board)) {
    return false;
  }
  const style = String(rep.board.style);
  return !NON_SWAPPABLE_BOARD_STYLES.has(style);
}
