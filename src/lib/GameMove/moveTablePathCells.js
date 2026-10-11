import { isExplorationPath } from "./moveTreeCellClasses";

/**
 * 0-based seat index for the player who plays the move stored at path index `movenum`
 * in a strict alternating sequential game (path 0 = ply 1, seat 0).
 * @param {number} movenum
 * @param {number} numPlayers
 */
export function moveActorSeatForPathIndex(movenum, numPlayers) {
  if (numPlayers < 1 || movenum == null || movenum < 0) {
    return 0;
  }
  return movenum % numPlayers;
}

/**
 * @param {unknown[] | undefined} pathRow
 * @returns {boolean}
 */
export function isMultiCellBranchPathRow(pathRow) {
  return Array.isArray(pathRow) && pathRow.length > 1;
}

/**
 * @param {{ path?: { exPath?: number[] } }[] | undefined} pathRow
 * @returns {boolean}
 */
export function pathRowHasExplorationBranch(pathRow) {
  if (!Array.isArray(pathRow)) {
    return false;
  }
  if (pathRow.length > 1) {
    return true;
  }
  return pathRow.some((cell) => isExplorationPath(cell?.path));
}

/**
 * When a path index holds multiple exploration lines, assign them to player columns
 * (sequential 2p stride layout). Mainline single-cell rows are unchanged.
 *
 * @param {Array<{ move?: string; premove?: boolean; path?: { exPath?: number[] } }>} cells
 * @param {{
 *   seatIdx: number;
 *   movenum: number;
 *   layout: { model: string; useRoundGrid: boolean; numcolumns: number };
 *   playerSeat?: number | null;
 *   toMoveSeat?: number | null;
 * }} ctx
 * @returns {typeof cells}
 */
export function filterPathCellsForSeat(cells, ctx) {
  if (!Array.isArray(cells) || cells.length <= 1) {
    return cells ?? [];
  }
  const { seatIdx, movenum, layout, playerSeat, toMoveSeat } = ctx;
  const { model, useRoundGrid, numcolumns } = layout;
  if (model !== "sequential" || useRoundGrid || numcolumns < 2) {
    return cells;
  }

  // Only direct premove on this node — not “child has premove” (opponent branches get that flag in the UI path).
  const premoveCells = cells.filter((c) => Boolean(c.premove));
  if (premoveCells.length > 0 && playerSeat != null && playerSeat >= 0) {
    const opponentSeat = playerSeat === 0 ? 1 : 0;
    if (seatIdx === playerSeat) {
      return premoveCells;
    }
    if (seatIdx === opponentSeat) {
      return cells.filter((c) => !c.premove);
    }
    return [];
  }

  const mainlineCells = cells.filter((c) => !isExplorationPath(c?.path));
  const branchCells = cells.filter((c) => isExplorationPath(c?.path));

  if (mainlineCells.length > 0 && branchCells.length > 0) {
    const mainSeat = moveActorSeatForPathIndex(movenum, numcolumns);
    const branchSeat =
      numcolumns === 2
        ? mainSeat === 0
          ? 1
          : 0
        : toMoveSeat != null && toMoveSeat >= 0
          ? toMoveSeat
          : mainSeat;
    if (seatIdx === mainSeat) {
      return mainlineCells;
    }
    if (seatIdx === branchSeat) {
      return branchCells;
    }
    return [];
  }

  if (branchCells.length === cells.length) {
    if (toMoveSeat != null && toMoveSeat >= 0) {
      return seatIdx === toMoveSeat ? cells : [];
    }
    const owner = moveActorSeatForPathIndex(movenum, numcolumns);
    return seatIdx === owner ? cells : [];
  }

  const owner = moveActorSeatForPathIndex(movenum, numcolumns);
  return seatIdx === owner ? cells : [];
}

/**
 * @param {{ players?: { id: string }[]; toMove?: string | number }} game
 * @param {{ id?: string } | null | undefined} globalMe
 */
export function resolveMoveTablePlayerSeats(game, globalMe) {
  let playerSeat = null;
  if (globalMe?.id && Array.isArray(game?.players)) {
    const idx = game.players.findIndex((p) => p.id === globalMe.id);
    if (idx >= 0) {
      playerSeat = idx;
    }
  }
  let toMoveSeat = null;
  if (game?.toMove !== "" && game?.toMove != null) {
    const n = Number(game.toMove);
    if (Number.isFinite(n) && n >= 0) {
      toMoveSeat = n;
    }
  }
  return { playerSeat, toMoveSeat };
}
