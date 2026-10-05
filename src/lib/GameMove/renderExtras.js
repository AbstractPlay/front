/**
 * Completed game on the move page (archive review). Uses session/API fields,
 * not focus-engine `gameover` (historical plies intentionally clear that flag).
 *
 * @param {{ gameOver?: boolean; gameEnded?: number }} game
 */
export function isGameMoveArchiveSession(game) {
  if (!game) return false;
  if (game.gameOver === true) return true;
  if (game.gameEnded != null && game.gameEnded !== 0) return true;
  return false;
}

/**
 * Render opts for Game Move (and board export frames). Live play uses seat
 * perspective; finished sessions lift hidden-info fog (Lab god / archive review).
 *
 * @param {{ me?: number; gameOver?: boolean; gameEnded?: number }} game
 * @returns {{ perspective: number; omniscient?: true }}
 */
export function buildGameMoveRenderExtras(game) {
  const perspective = game.me > -1 ? game.me + 1 : 1;
  if (isGameMoveArchiveSession(game)) {
    return { perspective, omniscient: true };
  }
  return { perspective };
}
