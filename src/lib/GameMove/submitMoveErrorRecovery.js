const MOVE_NUMBER_MISMATCH_RE =
  /Move number mismatch: browser has (\d+) moves but game has (\d+) moves/;

/**
 * @param {string} message
 * @returns {{ browserMoves: number, gameMoves: number } | null}
 */
export function parseMoveNumberMismatch(message) {
  const text = String(message ?? "");
  const match = text.match(MOVE_NUMBER_MISMATCH_RE);
  if (!match) {
    return null;
  }
  return {
    browserMoves: Number(match[1]),
    gameMoves: Number(match[2]),
  };
}

/**
 * After refetching game state, true when the server already recorded this submit
 * (e.g. duplicate submit_move) rather than a genuine stale client.
 *
 * @param {{
 *   mismatch: { browserMoves: number, gameMoves: number },
 *   explorationNodeCount: number,
 *   attemptedMove: string,
 *   tipMove: string | null | undefined,
 *   gameOver?: boolean,
 * }} pars
 */
export function submitMoveMismatchLooksApplied({
  mismatch,
  explorationNodeCount,
  attemptedMove,
  tipMove,
  gameOver,
}) {
  if (!mismatch || explorationNodeCount !== mismatch.gameMoves) {
    return false;
  }
  if (attemptedMove === "resign") {
    return Boolean(gameOver);
  }
  if (attemptedMove === "" || attemptedMove === "timeout") {
    return mismatch.gameMoves > mismatch.browserMoves;
  }
  return tipMove === attemptedMove;
}
