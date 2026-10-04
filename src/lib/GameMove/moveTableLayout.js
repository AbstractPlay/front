import {
  isStackAlignedRounds,
  moveTableRoundsFromExplorationPath,
  moveTableRowCountForEngine,
  moveTextForMoveTableSlot,
  moveTableStackMoveCount,
  normalizeMoveTableDensity,
  resolveMoveTableRounds,
  roundSlotToMoveText,
} from "@abstractplay/gameslib";
import { effectiveTurnModel } from "./effectiveTurnModel.js";

/**
 * @typedef {import("./effectiveTurnModel").TurnModel} TurnModel
 * @typedef {"sparse" | "auto"} MoveTableDensity
 * @typedef {{
 *   model: TurnModel;
 *   numcolumns: number;
 *   useRoundGrid: boolean;
 *   legacySimulHeader: boolean;
 *   density: MoveTableDensity;
 * }} MoveTableLayout
 */

export const MOVE_TREE_DENSITY_STORAGE_KEY = "moveTreeDensity";

export { isStackAlignedRounds, roundSlotToMoveText };

/**
 * @param {{ getMoveTableRounds?: unknown, pathIndexForMoveTableCell?: unknown }} engine
 */
function engineSupportsMoveTableApi(engine) {
  return (
    typeof engine?.getMoveTableRounds === "function" &&
    typeof engine?.pathIndexForMoveTableCell === "function"
  );
}

/**
 * @param {MoveTableDensity} density
 * @returns {import("@abstractplay/gameslib").MoveTableDensity}
 */
function toGameslibDensity(density) {
  return normalizeMoveTableDensity(density === "sparse" ? "sparse" : "auto");
}

/**
 * @param {{ stack?: unknown[] }} engine
 * @returns {number}
 */
function stackMoveCount(engine) {
  return moveTableStackMoveCount(engine ?? {});
}

/**
 * @param {{ stack?: unknown[] } | null | undefined} focusEngine
 * @param {number} pathLength
 * @param {unknown} exportState
 * @param {(metaGame: string, state: unknown) => { stack?: unknown[] }} createEngine
 * @param {string | undefined} metaGame
 * @returns {typeof focusEngine}
 */
export function resolveMoveTableExportEngine(
  focusEngine,
  pathLength,
  exportState,
  createEngine,
  metaGame
) {
  if (!focusEngine || pathLength <= 0 || typeof createEngine !== "function") {
    return focusEngine;
  }
  if (stackMoveCount(focusEngine) >= pathLength) {
    return focusEngine;
  }
  if (exportState == null || metaGame == null) {
    return focusEngine;
  }
  try {
    const candidate = createEngine(metaGame, exportState);
    if (stackMoveCount(candidate) >= pathLength) {
      return candidate;
    }
  } catch {
    /* keep focus engine */
  }
  return focusEngine;
}

/**
 * One table row per exploration path index; split N-part stack lastmove per seat.
 * @param {{ move?: unknown }[][]} path
 * @param {number} numPlayers
 * @param {number} pathLength
 */
export function buildStackRowsFromPathWire(path, numPlayers, pathLength) {
  return moveTableRoundsFromExplorationPath(path, numPlayers, pathLength);
}

/**
 * Build UI rows for sequenced games (compact density).
 * @param {{ getMoveTableRounds?: (opts: { density: string }) => unknown[], getPlies?: () => unknown[], numplayers?: number, numPlayers?: number }} engine
 */
export function buildDisplayRounds(engine) {
  if (typeof engine?.getMoveTableRounds === "function") {
    return engine.getMoveTableRounds({ density: "compact" });
  }
  throw new Error("buildDisplayRounds requires engine.getMoveTableRounds");
}

/**
 * @param {{ getRounds?: () => unknown[][], getPlies?: () => unknown[], stack?: unknown[] }} engine
 * @param {MoveTableLayout} layout
 * @param {number} [pathLength]
 * @param {{ move?: unknown }[][] | null | undefined} [path]
 */
export function getRoundsForLayout(engine, layout, pathLength = 0, path = null) {
  if (!layout.useRoundGrid) {
    return undefined;
  }
  if (!engineSupportsMoveTableApi(engine)) {
    return engine?.getRounds?.();
  }
  return resolveMoveTableRounds(engine, {
    density: toGameslibDensity(layout.density),
    model: layout.model,
    pathLength,
    path,
  });
}

/**
 * @returns {MoveTableDensity}
 */
export function readMoveTableDensityPreference() {
  if (typeof localStorage === "undefined") {
    return "auto";
  }
  return localStorage.getItem(MOVE_TREE_DENSITY_STORAGE_KEY) === "sparse"
    ? "sparse"
    : "auto";
}

/**
 * @param {TurnModel} model
 * @param {boolean} useRoundGrid
 * @returns {MoveTableDensity}
 */
export function resolveMoveTableDensity(model, useRoundGrid) {
  if (model !== "sequenced" || !useRoundGrid) {
    return "sparse";
  }
  return readMoveTableDensityPreference();
}

/**
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
    (model === "sequenced" &&
      (headerFromRecord === "sequenced" || engineModel === "sequenced")) ||
    (model === "simultaneous" &&
      (headerFromRecord === "simultaneous" || engineModel === "simultaneous"));

  const legacySimulHeader = Boolean(game.simultaneous && !useRoundGrid);
  const numcolumns = legacySimulHeader ? 1 : game.numPlayers;
  const density = resolveMoveTableDensity(model, useRoundGrid);

  return { model, numcolumns, useRoundGrid, legacySimulHeader, density };
}

/**
 * @param {{ layout: MoveTableLayout, seatIdx: number, movenum: number | null }} ctx
 * @returns {string}
 */
export function moveNumberForCell({ layout, seatIdx, movenum }) {
  if (movenum === null) {
    return "";
  }
  if (layout.useRoundGrid && seatIdx !== 0) {
    return "";
  }
  return `${movenum + 1}`;
}

/**
 * @param {{ rounds?: unknown[][] | null, layout: MoveTableLayout, rowIdx: number, seatIdx: number, path: { move?: unknown }[][], movenum: number | null }} ctx
 * @returns {string}
 */
export function moveTextForCell({
  layout,
  rounds,
  rowIdx,
  seatIdx,
  path,
  movenum,
}) {
  const pathLength = path?.length ?? 0;
  let slot = null;
  if (
    layout.useRoundGrid &&
    movenum != null &&
    isStackAlignedRounds(rounds, pathLength) &&
    movenum < pathLength &&
    Array.isArray(rounds?.[movenum])
  ) {
    slot = rounds[movenum][seatIdx] ?? null;
  } else if (Array.isArray(rounds?.[rowIdx])) {
    slot = rounds[rowIdx][seatIdx] ?? null;
  }

  if (layout.useRoundGrid && slot != null) {
    return moveTextForMoveTableSlot(slot, seatIdx, layout.numcolumns);
  }

  if (movenum === null || movenum >= path.length) {
    return "";
  }

  const entry = path[movenum]?.[0];
  const move = entry?.move;
  if (layout.model === "simultaneous" && move != null) {
    if (Array.isArray(move)) {
      return String(move[seatIdx] ?? "");
    }
    if (typeof move === "string" && move.includes(",")) {
      const parts = move.split(",");
      if (parts.length > seatIdx) {
        return parts[seatIdx] ?? "";
      }
    }
    return seatIdx === 0 ? String(move) : "";
  }

  if (move != null && layout.numcolumns > 1) {
    const wire = moveTextForMoveTableSlot(move, seatIdx, layout.numcolumns);
    if (wire !== "" || (typeof move === "string" && move.includes(","))) {
      return wire;
    }
  }

  return move == null ? "" : String(move);
}

/**
 * @param {{ rowIdx: number, seatIdx: number, pathLength: number, layout: MoveTableLayout, engine?: object, path?: { move?: unknown }[][] | null }} ctx
 * @returns {number | null}
 */
export function pathIndexForMoveCell({
  rowIdx,
  seatIdx,
  pathLength,
  layout,
  engine,
  path = null,
}) {
  const { numcolumns, useRoundGrid } = layout;

  if (!useRoundGrid) {
    const movenum = numcolumns * rowIdx + seatIdx;
    return movenum < pathLength ? movenum : null;
  }

  if (engineSupportsMoveTableApi(engine)) {
    return engine.pathIndexForMoveTableCell({
      density: toGameslibDensity(layout.density),
      model: layout.model,
      useRoundGrid,
      numcolumns,
      rowIdx,
      seatIdx,
      pathLength,
      path,
    });
  }

  const movenum = numcolumns * rowIdx + seatIdx;
  return movenum < pathLength ? movenum : null;
}

/**
 * @param {{ pathLength: number, layout: MoveTableLayout, engine?: object, path?: { move?: unknown }[][] | null }} ctx
 * @returns {number}
 */
export function moveTableRowCount({ pathLength, layout, engine, path = null }) {
  const { numcolumns, useRoundGrid } = layout;
  if (!useRoundGrid) {
    return Math.ceil(pathLength / numcolumns);
  }
  if (engineSupportsMoveTableApi(engine)) {
    return moveTableRowCountForEngine(engine, {
      density: toGameslibDensity(layout.density),
      model: layout.model,
      pathLength,
      useRoundGrid,
      numcolumns,
      path,
    });
  }
  const rounds = engine?.getRounds?.();
  if (Array.isArray(rounds) && rounds.length > 0) {
    return rounds.length;
  }
  return Math.ceil(pathLength / numcolumns);
}
