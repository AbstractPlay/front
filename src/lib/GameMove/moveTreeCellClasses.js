/**
 * CSS classes for live-play move tree cells (not used in Lab).
 */

/**
 * @param {{ exPath?: number[] } | null | undefined} path
 * @returns {boolean}
 */
export function isExplorationPath(path) {
  return (path?.exPath?.length ?? 0) > 0;
}

/**
 * @param {{
 *   movePath: { exPath?: number[] };
 *   isFocus?: boolean;
 *   isBranchPoint?: boolean;
 *   isActual?: boolean;
 * }} options
 * @returns {string}
 */
export function buildMoveCellClass({
  movePath,
  isFocus = false,
  isBranchPoint = false,
  isActual = false,
}) {
  const parts = ["gameMove"];
  if (isExplorationPath(movePath)) {
    parts.push("explorationMove");
  } else {
    parts.push("mainlineMove");
  }
  if (isActual) {
    parts.push("actualMove");
  }
  if (isFocus) {
    parts.push("gameMoveFocus");
  }
  if (isBranchPoint) {
    parts.push("lastMove");
    parts.push("branchPoint");
  }
  return parts.join(" ");
}

/**
 * @param {Array<Array<{ path?: { exPath?: number[] } }>>} path
 * @returns {boolean}
 */
export function pathHasExplorationMoves(path) {
  if (!Array.isArray(path)) {
    return false;
  }
  for (const row of path) {
    if (!Array.isArray(row)) {
      continue;
    }
    for (const cell of row) {
      if (isExplorationPath(cell?.path)) {
        return true;
      }
    }
  }
  return false;
}
