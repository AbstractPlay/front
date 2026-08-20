import { effectiveTurnModel } from "./effectiveTurnModel";

/**
 * @typedef {import("./effectiveTurnModel").TurnModel} TurnModel
 * @typedef {{
 *   model: TurnModel;
 *   numcolumns: number;
 *   useRoundGrid: boolean;
 *   legacySimulHeader: boolean;
 * }} MoveTableLayout
 */

/**
 * Round-grid layout activates only when header or engine confirms null-slot export.
 * Legacy `game.simultaneous` alone keeps single-column stride layout.
 * @param {{ game: { simultaneous?: boolean, numPlayers: number }, engine?: { turnModel?: () => TurnModel, getRounds?: () => unknown[][] }, gameRec?: { header?: Record<string, unknown> } }} ctx
 * @returns {MoveTableLayout}
 */
export function resolveMoveTableLayout({ game, engine, gameRec }) {
  const model = effectiveTurnModel({ game, engine, gameRec });
  const headerFromRecord = gameRec?.header?.["turn-model"];
  const engineModel =
    typeof engine?.turnModel === "function" ? engine.turnModel() : undefined;

  const useRoundGrid =
    model === "skip-turn" ||
    (model === "simultaneous" &&
      (headerFromRecord === "simultaneous" || engineModel === "simultaneous"));

  const legacySimulHeader = Boolean(game.simultaneous && !useRoundGrid);
  const numcolumns = legacySimulHeader ? 1 : game.numPlayers;

  return { model, numcolumns, useRoundGrid, legacySimulHeader };
}

/**
 * Map table cell (row, seat) to exploration path index, or null for empty seat.
 * @param {{ rowIdx: number, seatIdx: number, pathLength: number, layout: MoveTableLayout, engine?: { getRounds?: () => unknown[][] } }} ctx
 * @returns {number | null}
 */
export function pathIndexForMoveCell({
  rowIdx,
  seatIdx,
  pathLength,
  layout,
  engine,
}) {
  const { numcolumns, useRoundGrid } = layout;

  if (!useRoundGrid) {
    const movenum = numcolumns * rowIdx + seatIdx;
    return movenum < pathLength ? movenum : null;
  }

  const rounds = engine?.getRounds?.();
  if (!Array.isArray(rounds) || rowIdx >= rounds.length) {
    const movenum = numcolumns * rowIdx + seatIdx;
    return movenum < pathLength ? movenum : null;
  }

  const row = rounds[rowIdx];
  if (!Array.isArray(row) || seatIdx >= row.length || row[seatIdx] === null) {
    return null;
  }

  let plyIndex = 0;
  for (let r = 0; r < rowIdx; r++) {
    for (let s = 0; s < rounds[r].length; s++) {
      if (rounds[r][s] !== null) plyIndex++;
    }
  }
  for (let s = 0; s < seatIdx; s++) {
    if (row[s] !== null) plyIndex++;
  }
  return plyIndex < pathLength ? plyIndex : null;
}

/**
 * @param {{ pathLength: number, layout: MoveTableLayout, engine?: { getRounds?: () => unknown[][] } }} ctx
 * @returns {number}
 */
export function moveTableRowCount({ pathLength, layout, engine }) {
  const { numcolumns, useRoundGrid } = layout;
  if (!useRoundGrid) {
    return Math.ceil(pathLength / numcolumns);
  }
  const rounds = engine?.getRounds?.();
  if (Array.isArray(rounds) && rounds.length > 0) {
    return rounds.length;
  }
  return Math.ceil(pathLength / numcolumns);
}
