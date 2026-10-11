import { isPlayerIndexOnMove } from "../gameClockDisplay.js";
import { getFocusNode } from "./exploration.js";

/**
 * Who is "to move" for play UI (move entry, strip dock, session toMove).
 * At the live main-line tip, use API {@link game.toMove}; in history or exploration branches, use the focus node.
 *
 * @param {object | null | undefined} game
 * @param {unknown[] | null | undefined} exploration
 * @param {{ moveNumber: number; exPath?: number[] } | null | undefined} focus
 * @returns {string | number | ""}
 */
export function resolvePlayUiToMove(game, exploration, focus) {
  if (!game || !exploration?.length || !focus) {
    return "";
  }
  if (game.simultaneous) {
    return game.toMove ?? "";
  }
  const atLiveMainlineTip =
    !game.gameOver &&
    focus.moveNumber === exploration.length - 1 &&
    (focus.exPath?.length ?? 0) === 0 &&
    game.toMove !== "" &&
    game.toMove !== undefined &&
    game.toMove !== null;

  if (atLiveMainlineTip) {
    return game.toMove;
  }

  const node = getFocusNode(exploration, game, focus);
  const nodeToMove = node?.toMove;
  if (nodeToMove === "" || nodeToMove === null || nodeToMove === undefined) {
    return "";
  }
  return nodeToMove;
}

/**
 * @param {object | null | undefined} game
 * @param {string | number | ""} toMove
 * @returns {boolean}
 */
export function isMyTurnForPlayUi(game, toMove) {
  if (!game?.canSubmit || game.me == null || game.me < 0) {
    return false;
  }
  return isPlayerIndexOnMove(game.me, toMove);
}
