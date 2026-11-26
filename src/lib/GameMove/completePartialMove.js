/**
 * Build a move payload for "Complete move" using the latest draft text.
 * Avoids stale committed state when single-line entry debounce has not flushed.
 */
export function completePartialMoveFromDraft({ move, moveDraft, validate }) {
  const value = moveDraft ?? move?.move ?? "";
  const validation = validate(value);
  return {
    ...validation,
    move: value,
    rendered: move?.rendered ?? "",
    complete: 1,
  };
}

export function shouldShowCompleteMoveButton(move, moveDraft) {
  if (move?.complete === 1) {
    return false;
  }
  const draft = moveDraft ?? "";
  const committed = move?.move ?? "";
  if (move?.valid && move?.complete === 0 && committed.length > 0) {
    return true;
  }
  return draft.length > 0 && draft !== committed;
}