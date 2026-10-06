/**
 * Live play only: server `partialMove` preview while a simultaneous round is in progress.
 * Not shared with Lab playground seat mode.
 */

/**
 * @param {string | undefined | null} partialMove
 * @param {number} numPlayers
 * @returns {string[]}
 */
export function splitLivePartialRow(partialMove, numPlayers) {
  if (partialMove === undefined || partialMove === null || partialMove === "") {
    return Array(numPlayers).fill("");
  }
  const moves = partialMove.split(",");
  while (moves.length < numPlayers) {
    moves.push("");
  }
  return moves.slice(0, numPlayers);
}

/**
 * @param {string | undefined | null} partialMove
 * @param {number} numPlayers
 */
export function livePartialMoveHasContent(partialMove, numPlayers) {
  if (partialMove === undefined || partialMove === null) {
    return false;
  }
  if (partialMove.length <= numPlayers - 1) {
    return false;
  }
  return splitLivePartialRow(partialMove, numPlayers).some((m) => m !== "");
}

/**
 * @param {string | undefined | null} partialMove
 * @param {number} me player index (0-based), or -1 spectator
 * @param {number} numPlayers
 */
export function partialMoveSeatFragment(partialMove, me, numPlayers) {
  if (me < 0) {
    return "";
  }
  return splitLivePartialRow(partialMove, numPlayers)[me] ?? "";
}

/**
 * @param {{
 *   simultaneous?: boolean;
 *   partialMove?: string;
 *   numPlayers?: number;
 *   toMove?: unknown;
 * }} game
 * @param {unknown[] | null | undefined} exploration
 * @param {{ moveNumber?: number; exPath?: unknown[] } | null | undefined} focus
 */
export function shouldApplyLivePartialPreview(game, exploration, focus) {
  if (!game?.simultaneous || !exploration?.length || !focus) {
    return false;
  }
  if (game.toMove === "") {
    return false;
  }
  const numPlayers = game.numPlayers ?? 0;
  if (!livePartialMoveHasContent(game.partialMove, numPlayers)) {
    return false;
  }
  if (focus.moveNumber !== exploration.length - 1) {
    return false;
  }
  if ((focus.exPath?.length ?? 0) > 0) {
    return false;
  }
  return true;
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {string} partialMove
 * @param {number} numPlayers
 */
export function applyLivePartialPreview(engine, partialMove, numPlayers) {
  if (!livePartialMoveHasContent(partialMove, numPlayers)) {
    return false;
  }
  engine.move(partialMove, { partial: true, trusted: true });
  return true;
}

/**
 * Comma-separated wire for move-table synthetic row (one cell per seat).
 *
 * @param {string | undefined | null} partialMove
 * @param {number} numPlayers
 */
export function livePartialMoveWireForTable(partialMove, numPlayers) {
  return splitLivePartialRow(partialMove, numPlayers).join(",");
}
