import { coloursEqual } from "./resolveEffectivePalette.js";

/**
 * Board colour defaults to background when omitted. Drop a saved `board` that
 * matches `background` so light/dark mode merges are not pinned to one mode.
 */
export function omitRedundantBoardFromColourContext(colourContext) {
  if (!colourContext || typeof colourContext !== "object") {
    return colourContext;
  }
  const { board, background } = colourContext;
  if (board === undefined) {
    return colourContext;
  }
  if (coloursEqual(board, background)) {
    const { board: _removed, ...rest } = colourContext;
    return rest;
  }
  return colourContext;
}
