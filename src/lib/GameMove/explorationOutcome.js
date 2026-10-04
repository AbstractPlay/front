/** @typedef {-1 | -2 | 0 | 1} ExplorationOutcome */

export const EXPLORATION_OUTCOME_UNDECIDED = -1;
/** Explicit draw annotation on an explored line (leaf). */
export const EXPLORATION_OUTCOME_DRAW = -2;

/**
 * @param {number | undefined | null} outcome
 * @returns {boolean}
 */
export function isPlayerWinExplorationOutcome(outcome) {
  return outcome === 0 || outcome === 1;
}

/**
 * @param {number | undefined | null} outcome
 * @returns {boolean}
 */
export function showsExplorationOutcomeMarker(outcome) {
  return (
    isPlayerWinExplorationOutcome(outcome) ||
    outcome === EXPLORATION_OUTCOME_DRAW
  );
}

/**
 * Derive the annotated outcome at a parent from its replies (mainline + variations).
 * Side to move can choose among children: a winning reply wins; else a draw if any;
 * else loss only when every reply is losing; otherwise undecided.
 *
 * @param {number[]} childOutcomes
 * @param {0 | 1} toMove player to move at the parent
 * @returns {ExplorationOutcome}
 */
export function deriveParentExplorationOutcome(childOutcomes, toMove) {
  if (!childOutcomes.length) {
    return EXPLORATION_OUTCOME_UNDECIDED;
  }
  const sideToMove = toMove;
  const opponent = 1 - sideToMove;
  let canForceWin = false;
  let canForceDraw = false;
  let allLoss = true;

  for (const outcome of childOutcomes) {
    if (outcome === sideToMove) {
      canForceWin = true;
    }
    if (outcome === EXPLORATION_OUTCOME_DRAW) {
      canForceDraw = true;
    }
    if (outcome !== opponent) {
      allLoss = false;
    }
  }

  if (canForceWin) {
    return sideToMove;
  }
  if (canForceDraw) {
    return EXPLORATION_OUTCOME_DRAW;
  }
  if (allLoss) {
    return opponent;
  }
  return EXPLORATION_OUTCOME_UNDECIDED;
}
