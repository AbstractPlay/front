import {
  getMoveTableRoundsForEngine,
  isStackAlignedRounds,
  moveTableRoundsFromExplorationPath,
  moveTableRowCountForEngine,
  moveTextForMoveTableSlot,
  moveTableStackMoveCount,
  wireMoveTokenForSeat,
  normalizeMoveTableDensity,
  packPliesForMoveTable,
  pathIndexForMoveTableCell as pathIndexForMoveTableCellFromGameslib,
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
 * @param {{ actor: number, move: string, playOrder?: number, results?: unknown[] }} ply
 */
function plyToRoundSlot(ply) {
  const results = ply.results ?? [];
  if (ply.playOrder !== undefined && ply.playOrder !== ply.actor) {
    if (results.length > 0) {
      return { move: ply.move, sequence: ply.playOrder, result: [...results] };
    }
    return { move: ply.move, sequence: ply.playOrder };
  }
  if (results.length > 0) {
    return { move: ply.move, result: [...results] };
  }
  return ply.move;
}

/**
 * @param {{ actor: number, move: string, playOrder?: number, results?: unknown[] }[]} group
 * @param {number} numPlayers
 */
function buildRoundRowFromPlies(group, numPlayers) {
  const row = new Array(numPlayers).fill(null);
  for (const ply of group) {
    row[ply.actor - 1] = plyToRoundSlot(ply);
  }
  return row;
}

/**
 * Plain-object engines (tests) and pre-API gameslib: synthesize move-table methods.
 * @param {object} engine
 */
function pathIndexFromRoundGridOnly(engine, opts) {
  const rounds = engine.getRounds?.();
  if (!Array.isArray(rounds) || opts.rowIdx >= rounds.length) {
    return null;
  }
  const row = rounds[opts.rowIdx];
  if (!Array.isArray(row) || opts.seatIdx >= row.length || row[opts.seatIdx] == null) {
    return null;
  }
  if (opts.model === "simultaneous") {
    return opts.rowIdx < opts.pathLength ? opts.rowIdx : null;
  }
  if (opts.model === "sequenced" && isStackAlignedRounds(rounds, opts.pathLength)) {
    return opts.rowIdx < opts.pathLength ? opts.rowIdx : null;
  }
  let plyIndex = 0;
  for (let r = 0; r < opts.rowIdx; r++) {
    for (let s = 0; s < rounds[r].length; s++) {
      if (rounds[r][s] !== null) {
        plyIndex++;
      }
    }
  }
  for (let s = 0; s < opts.seatIdx; s++) {
    if (row[s] !== null) {
      plyIndex++;
    }
  }
  return plyIndex < opts.pathLength ? plyIndex : null;
}

function ensureMoveTableApi(engine) {
  if (!engine || engineSupportsMoveTableApi(engine)) {
    return engine;
  }
  if (
    typeof engine.getRounds === "function" &&
    typeof engine.getPlies !== "function"
  ) {
    const host = {
      ...engine,
      numplayers: engine.numplayers ?? engine.numPlayers ?? 0,
      getPlies: () => [],
      getMoveTableRounds: () => engine.getRounds(),
      pathIndexForMoveTableCell(opts) {
        return pathIndexFromRoundGridOnly(engine, opts);
      },
    };
    return host;
  }
  if (typeof engine.getPlies !== "function") {
    return engine;
  }
  const numplayers = engine.numplayers ?? engine.numPlayers ?? 0;
  const host = {
    ...engine,
    numplayers,
    turnModel:
      typeof engine.turnModel === "function"
        ? engine.turnModel.bind(engine)
        : () => "sequenced",
    getRounds:
      typeof engine.getRounds === "function"
        ? engine.getRounds.bind(engine)
        : () => [],
    getMoveTableRounds(opts = {}) {
      if (typeof engine.getMoveTableRounds === "function") {
        return engine.getMoveTableRounds(opts);
      }
      return getMoveTableRoundsForEngine(
        host,
        opts,
        (group) => buildRoundRowFromPlies(group, numplayers)
      );
    },
    pathIndexForMoveTableCell(opts) {
      if (typeof engine.pathIndexForMoveTableCell === "function") {
        return engine.pathIndexForMoveTableCell(opts);
      }
      return pathIndexForMoveTableCellFromGameslib(host, opts);
    },
  };
  return host;
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
  const api = ensureMoveTableApi(engine);
  if (typeof api?.getMoveTableRounds === "function") {
    return api.getMoveTableRounds({ density: "compact" });
  }
  const plies = engine.getPlies();
  const numPlayers = engine.numplayers ?? engine.numPlayers;
  if (!numPlayers || numPlayers < 1) {
    throw new Error("buildDisplayRounds requires engine.numplayers");
  }
  return packPliesForMoveTable(plies, numPlayers, (group) =>
    buildRoundRowFromPlies(group, numPlayers)
  );
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
  const api = ensureMoveTableApi(engine);
  if (!engineSupportsMoveTableApi(api)) {
    return engine?.getRounds?.();
  }
  return resolveMoveTableRounds(api, {
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
    const wire = wireMoveTokenForSeat(move, seatIdx, layout.numcolumns);
    if (wire !== null) {
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

  const api = ensureMoveTableApi(engine);
  if (engineSupportsMoveTableApi(api)) {
    return api.pathIndexForMoveTableCell({
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
  const api = ensureMoveTableApi(engine);
  if (engineSupportsMoveTableApi(api)) {
    return moveTableRowCountForEngine(api, {
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
