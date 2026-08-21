import { effectiveTurnModel } from "./effectiveTurnModel";

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

function buildSparseRowFromPly(ply, numPlayers) {
  const row = new Array(numPlayers).fill(null);
  row[ply.actor - 1] = plyToRoundSlot(ply);
  return row;
}

function buildDenseRowFromPlies(plies, numPlayers) {
  const row = new Array(numPlayers).fill(null);
  for (const ply of plies) {
    row[ply.actor - 1] = plyToRoundSlot(ply);
  }
  return row;
}

function roundGroupHasDuplicateActor(plies) {
  const seen = new Set();
  for (const ply of plies) {
    if (seen.has(ply.actor)) {
      return true;
    }
    seen.add(ply.actor);
  }
  return false;
}

/**
 * Build UI rows for sequenced games: dense seat-cycle rows when each actor
 * acts at most once per ply.round; sparse one-ply rows when any actor repeats.
 * @param {{ getPlies: () => { actor: number, move: string, round: number, playOrder?: number, results?: unknown[] }[], numplayers?: number, numPlayers?: number }} engine
 */
export function buildDisplayRounds(engine) {
  const plies = engine.getPlies();
  const numPlayers = engine.numplayers ?? engine.numPlayers;
  if (!numPlayers || numPlayers < 1) {
    throw new Error("buildDisplayRounds requires engine.numplayers");
  }

  /** @type {Map<number, typeof plies>} */
  const groups = new Map();
  for (const ply of plies) {
    const list = groups.get(ply.round);
    if (list) {
      list.push(ply);
    } else {
      groups.set(ply.round, [ply]);
    }
  }

  const roundIds = [...groups.keys()].sort((a, b) => a - b);
  const displayRounds = [];

  for (const roundId of roundIds) {
    const group = groups.get(roundId);
    if (!group || group.length === 0) {
      continue;
    }
    if (roundGroupHasDuplicateActor(group)) {
      for (const ply of group) {
        displayRounds.push(buildSparseRowFromPly(ply, numPlayers));
      }
    } else {
      displayRounds.push(buildDenseRowFromPlies(group, numPlayers));
    }
  }

  return displayRounds;
}

/**
 * @param {{ getRounds?: () => unknown[][], getPlies?: () => unknown[] }} engine
 * @param {MoveTableLayout} layout
 */
export function getRoundsForLayout(engine, layout) {
  if (!layout.useRoundGrid) {
    return undefined;
  }
  if (
    layout.density === "auto" &&
    layout.model === "sequenced" &&
    typeof engine?.getPlies === "function"
  ) {
    try {
      return buildDisplayRounds(engine);
    } catch {
      return engine?.getRounds?.();
    }
  }
  return engine?.getRounds?.();
}

/**
 * Round-grid layout activates when header or engine confirms null-slot export
 * (skip-turn, simultaneous) or sparse sequenced rows (Frogger refills, Gnostica).
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
 * Map table cell (row, seat) to exploration path index, or null for empty seat.
 * @param {{ rowIdx: number, seatIdx: number, pathLength: number, layout: MoveTableLayout, engine?: { getRounds?: () => unknown[][], getPlies?: () => unknown[] } }} ctx
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

  const rounds = getRoundsForLayout(engine, layout);
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
 * @param {{ pathLength: number, layout: MoveTableLayout, engine?: { getRounds?: () => unknown[][], getPlies?: () => unknown[] } }} ctx
 * @returns {number}
 */
export function moveTableRowCount({ pathLength, layout, engine }) {
  const { numcolumns, useRoundGrid } = layout;
  if (!useRoundGrid) {
    return Math.ceil(pathLength / numcolumns);
  }
  const rounds = getRoundsForLayout(engine, layout);
  if (Array.isArray(rounds) && rounds.length > 0) {
    return rounds.length;
  }
  return Math.ceil(pathLength / numcolumns);
}
