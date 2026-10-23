/**
 * Build the next move-box draft when appending from stash/board clicks.
 * @param {string} draft
 * @param {string} movePart
 * @param {((current: string, part: string) => string) | undefined} handler
 */
export function appendMovePartToDraft(draft, movePart, handler) {
  const base = draft ?? "";
  if (handler) {
    return handler(base, movePart);
  }
  return base + movePart;
}
