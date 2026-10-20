import { isExplorationPath } from "../GameMove/moveTreeCellClasses";
import {
  filterPathCellsForSeat,
  moveActorSeatForPathIndex,
} from "../GameMove/moveTablePathCells";

/**
 * Playground move table: keep mainline + local exploration siblings in one column
 * (live play keeps hex/tip column split via filterPathCellsForSeat).
 */
export function filterLabPathCellsForSeat(cells, ctx) {
  if (!Array.isArray(cells) || cells.length <= 1) {
    return filterPathCellsForSeat(cells, ctx);
  }

  const mainlineCells = cells.filter((c) => !isExplorationPath(c?.path));
  const branchCells = cells.filter((c) => isExplorationPath(c?.path));

  if (mainlineCells.length > 0 && branchCells.length > 0) {
    const mlMove = mainlineCells[0]?.path?.moveNumber;
    const localPlyExploration =
      mainlineCells.length === 1 &&
      !mainlineCells.some((c) => String(c.class ?? "").includes("actualMove")) &&
      mlMove != null &&
      branchCells.every(
        (c) =>
          (c.path?.exPath?.length ?? 0) > 0 &&
          (c.path?.moveNumber ?? 0) < mlMove
      );
    if (localPlyExploration) {
      const { seatIdx, movenum, layout } = ctx;
      const owner = moveActorSeatForPathIndex(movenum, layout.numcolumns);
      return seatIdx === owner ? cells : [];
    }
  }

  return filterPathCellsForSeat(cells, ctx);
}
