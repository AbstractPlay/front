/** @see node-backend lib/ladders/displayName.ts */
export function ladderDetailPathActive(ladderId) {
  return `/ladder/${ladderId}`;
}

/** Ladder list, optionally filtered to one meta game. */
export function ladderListPath(metaGame = null) {
  if (
    metaGame !== null &&
    metaGame !== undefined &&
    metaGame !== "" &&
    metaGame !== "undefined"
  ) {
    return `/ladders/all/${metaGame}`;
  }
  return "/ladders/all";
}

/** From dashboard / game rows when `ladderId` is set. */
export function ladderDetailPathFromGameRef(ladderId) {
  if (ladderId === undefined || ladderId === null || ladderId === "") {
    return null;
  }
  return ladderDetailPathActive(String(ladderId));
}
