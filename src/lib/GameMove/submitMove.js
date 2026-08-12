/**
 * Pending move at the exploration tip, when the player may submit.
 * Shared by MoveEntry and integration tests.
 */
export function getPendingSubmitMove(exploration, focus, { canSubmit } = {}) {
  if (!canSubmit || !focus?.exPath?.length) {
    return null;
  }
  const spine = exploration[exploration.length - 1];
  return spine?.children?.[focus.exPath[0]]?.move ?? null;
}
