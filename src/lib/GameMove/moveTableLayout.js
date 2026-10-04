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

/** @type {string} */
const SIMULTANEOUS_ELIM_CHAR = "\u0091";

/**
 * @param {{ stack?: unknown[] }} engine
 * @returns {number}
 */
function stackMoveCount(engine) {
  if (engine && Array.isArray(engine.stack) && engine.stack.length > 1) {
    return engine.stack.length - 1;
  }
  return 0;
}

/**
 * In-progress move trees list every mainline move while the focused board engine
 * only includes stack depth through the focus node. Build rounds/path indices from
 * a deeper export state when the focus engine stack is too shallow.
 *
 * @param {{ stack?: unknown[] } | null | undefined} focusEngine
 * @param {number} pathLength
 * @param {unknown} exportState serialized game state (exploration tail or live game)
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
 * One export row per stack move (Entropy, Thricewise wire, …).
 * @param {unknown[] | null | undefined} rounds
 * @param {number} pathLength
 * @returns {boolean}
 */
export function isStackAlignedRounds(rounds, pathLength) {
  return (
    Array.isArray(rounds) &&
    pathLength > 0 &&
    rounds.length === pathLength
  );
}

/**
 * @param {unknown} move
 * @param {number} seatIdx
 * @param {number} numPlayers
 * @returns {string | null} null when move is not N-part simultaneous wire
 */
function wireMoveTokenForSeat(move, seatIdx, numPlayers) {
  if (Array.isArray(move)) {
    return String(move[seatIdx] ?? "");
  }
  if (typeof move !== "string" || !move.includes(",")) {
    return null;
  }
  const parts = move.split(/\s*,\s*/);
  if (parts.length !== numPlayers) {
    return null;
  }
  const token = parts[seatIdx] ?? "";
  if (token === "" || token === SIMULTANEOUS_ELIM_CHAR) {
    return "";
  }
  return token;
}

/**
 * @param {unknown[][]} fromRounds
 * @param {number} numPlayers
 */
function roundsLookStackIndexed(fromRounds, numPlayers) {
  if (!Array.isArray(fromRounds) || fromRounds.length === 0 || numPlayers < 1) {
    return false;
  }
  return fromRounds.every(
    (row) => Array.isArray(row) && row.length === numPlayers
  );
}

function pathHasNPartWireRows(path, pathLength, numPlayers) {
  if (!Array.isArray(path) || pathLength < 1 || numPlayers < 2) {
    return false;
  }
  for (let i = 0; i < pathLength; i++) {
    const move = path[i]?.[0]?.move;
    if (wireMoveTokenForSeat(move, 0, numPlayers) !== null) {
      return true;
    }
  }
  return false;
}

/**
 * One table row per exploration path index; split N-part stack lastmove per seat.
 * @param {{ move?: unknown }[][]} path
 * @param {number} numPlayers
 * @param {number} pathLength
 */
export function buildStackRowsFromPathWire(path, numPlayers, pathLength) {
  const rows = [];
  for (let i = 0; i < pathLength; i++) {
    const row = new Array(numPlayers).fill(null);
    const move = path[i]?.[0]?.move;
    for (let seatIdx = 0; seatIdx < numPlayers; seatIdx++) {
      const wire = wireMoveTokenForSeat(move, seatIdx, numPlayers);
      if (wire !== null && wire !== "") {
        row[seatIdx] = wire;
      }
    }
    rows.push(row);
  }
  return rows;
}

function stackRoundsLookComplete(fromRounds, alignLen, numPlayers, engine) {
  if (
    !Array.isArray(fromRounds) ||
    !roundsLookStackIndexed(fromRounds, numPlayers) ||
    fromRounds.length !== alignLen ||
    stackMoveCount(engine) !== alignLen
  ) {
    return false;
  }
  for (let i = 0; i < alignLen; i++) {
    const row = fromRounds[i];
    for (let s = 0; s < numPlayers; s++) {
      const slot = row[s];
      if (slot == null) {
        continue;
      }
      const text = roundSlotToMoveText(slot);
      if (
        text.includes(",") &&
        wireMoveTokenForSeat(text, 0, numPlayers) !== null
      ) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {{ move?: unknown }[][] | null | undefined} path
 */
function pathIndexFromWireRow(rowIdx, seatIdx, pathLength, layout, path) {
  if (
    !layout.useRoundGrid ||
    !Array.isArray(path) ||
    rowIdx >= pathLength ||
    layout.numcolumns < 2
  ) {
    return null;
  }
  const move = path[rowIdx]?.[0]?.move;
  const wire = wireMoveTokenForSeat(move, seatIdx, layout.numcolumns);
  if (wire === null || wire === "") {
    return null;
  }
  return rowIdx;
}

/**
 * Prefer `getRounds()` one-row-per-stack export (Thricewise wire) over ply-derived
 * display rows when any stack entry expands to multiple plies.
 * @param {{ getPlies?: () => { stackIndex?: number }[], numplayers?: number, numPlayers?: number }} engine
 * @param {unknown[][]} fromRounds
 * @param {number} alignLen
 */
function preferStackIndexedRounds(engine, fromRounds, alignLen) {
  const numPlayers = engine?.numplayers ?? engine?.numPlayers ?? 0;
  if (
    !roundsLookStackIndexed(fromRounds, numPlayers) ||
    fromRounds.length !== alignLen
  ) {
    return false;
  }
  if (typeof engine?.getPlies !== "function") {
    return true;
  }
  /** @type {Map<number, number>} */
  const plyCountByStack = new Map();
  for (const ply of engine.getPlies()) {
    if (ply.stackIndex == null) {
      continue;
    }
    plyCountByStack.set(
      ply.stackIndex,
      (plyCountByStack.get(ply.stackIndex) ?? 0) + 1
    );
  }
  for (const count of plyCountByStack.values()) {
    if (count > 1) {
      return true;
    }
  }
  return false;
}

/**
 * @param {{ rounds?: unknown[][] | null, layout: MoveTableLayout, rowIdx: number, seatIdx: number, movenum: number | null, path: { move?: unknown }[][] | null | undefined }} ctx
 */
function roundSlotAt({ rounds, layout, rowIdx, seatIdx, movenum, path }) {
  const pathLength = path?.length ?? 0;
  if (
    layout.useRoundGrid &&
    movenum != null &&
    isStackAlignedRounds(rounds, pathLength) &&
    movenum < pathLength &&
    Array.isArray(rounds[movenum])
  ) {
    return rounds[movenum][seatIdx] ?? null;
  }
  if (Array.isArray(rounds?.[rowIdx])) {
    return rounds[rowIdx][seatIdx] ?? null;
  }
  return null;
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
 * Map sequenced round-grid cell to exploration path when plies carry stackIndex
 * (e.g. Thricewise wire lastmove expanded to one ply per seat).
 * @param {{ getPlies?: () => { actor: number, move: string, stackIndex?: number }[] }} engine
 * @param {number} rowIdx
 * @param {number} seatIdx
 * @param {number} pathLength
 * @returns {number | null}
 */
function pathIndexFromStackIndexForSequencedCell(
  engine,
  rowIdx,
  seatIdx,
  pathLength
) {
  if (typeof engine?.getPlies !== "function") {
    return null;
  }
  try {
    const displayRounds = buildDisplayRounds(engine);
    if (rowIdx >= displayRounds.length) {
      return null;
    }
    const row = displayRounds[rowIdx];
    if (!Array.isArray(row) || row[seatIdx] == null) {
      return null;
    }
    const moveText = roundSlotToMoveText(row[seatIdx]);
    const plies = engine.getPlies();
    const ply = plies.find(
      (p) => p.actor === seatIdx + 1 && String(p.move) === moveText
    );
    if (ply?.stackIndex == null) {
      return null;
    }
    const pathIdx = ply.stackIndex - 1;
    return pathIdx < pathLength ? pathIdx : null;
  } catch {
    return null;
  }
}

/**
 * Round-grid rows for the move table. Priority (first match wins):
 * 1. Trim over-long stack-indexed `getRounds()` to path/stack depth.
 * 2. Engine `getRounds()` when a stack frame maps to multiple plies (Thricewise wire).
 * 3. Engine `getRounds()` when sparse density and stack-aligned (path index = row).
 * 4. Exploration path wire split when sequenced lastmoves use comma wire.
 * 5. Ply `round` grouping when sequenced + compact density.
 * 6. Engine `getRounds()` fallback.
 *
 * @param {{ getRounds?: () => unknown[][], getPlies?: () => unknown[], stack?: unknown[] }} engine
 * @param {MoveTableLayout} layout
 * @param {number} [pathLength]
 * @param {{ move?: unknown }[][] | null | undefined} [path]
 */
export function getRoundsForLayout(engine, layout, pathLength = 0, path = null) {
  if (!layout.useRoundGrid) {
    return undefined;
  }
  const fromRounds = engine?.getRounds?.();
  const stackCount = stackMoveCount(engine);
  const alignLen = pathLength > 0 ? pathLength : stackCount;
  const numPlayers = engine?.numplayers ?? engine?.numPlayers ?? 0;
  const fromRoundsStackIndexed =
    Array.isArray(fromRounds) && roundsLookStackIndexed(fromRounds, numPlayers);

  if (fromRoundsStackIndexed && fromRounds.length > alignLen && alignLen > 0) {
    return fromRounds.slice(0, alignLen);
  }
  if (
    fromRoundsStackIndexed &&
    fromRounds.length > 0 &&
    preferStackIndexedRounds(engine, fromRounds, alignLen)
  ) {
    return fromRounds;
  }
  const useStackSparseGrid =
    layout.density !== "auto" &&
    stackRoundsLookComplete(fromRounds, alignLen, numPlayers, engine);
  if (useStackSparseGrid) {
    return fromRounds;
  }
  if (
    pathLength > 0 &&
    Array.isArray(path) &&
    layout.model === "sequenced" &&
    numPlayers > 1 &&
    stackCount >= pathLength &&
    pathHasNPartWireRows(path, pathLength, numPlayers)
  ) {
    return buildStackRowsFromPathWire(path, numPlayers, pathLength);
  }
  if (
    layout.density === "auto" &&
    layout.model === "sequenced" &&
    typeof engine?.getPlies === "function"
  ) {
    try {
      return buildDisplayRounds(engine);
    } catch {
      return fromRounds;
    }
  }
  return fromRounds;
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
 * @param {unknown} slot
 * @returns {string}
 */
export function roundSlotToMoveText(slot) {
  if (slot == null) {
    return "";
  }
  if (typeof slot === "string") {
    return slot;
  }
  if (typeof slot === "object" && slot !== null && "move" in slot) {
    return String(/** @type {{ move: unknown }} */ (slot).move ?? "");
  }
  return String(slot);
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
 * @param {{ layout: MoveTableLayout, rounds?: unknown[][] | null, rowIdx: number, seatIdx: number, path: { move?: unknown }[][], movenum: number | null }} ctx
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
  const slot = roundSlotAt({
    rounds,
    layout,
    rowIdx,
    seatIdx,
    movenum,
    path,
  });
  if (layout.useRoundGrid && slot != null) {
    const slotText = roundSlotToMoveText(slot);
    if (layout.numcolumns > 1) {
      const wire = wireMoveTokenForSeat(slotText, seatIdx, layout.numcolumns);
      if (wire !== null) {
        return wire;
      }
    }
    return slotText;
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
 * Map table cell (row, seat) to exploration path index, or null for empty seat.
 * @param {{ rowIdx: number, seatIdx: number, pathLength: number, layout: MoveTableLayout, engine?: { getRounds?: () => unknown[][], getPlies?: () => unknown[] }, path?: { move?: unknown }[][] | null }} ctx
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

  const rounds = getRoundsForLayout(engine, layout, pathLength, path);
  if (!Array.isArray(rounds) || rowIdx >= rounds.length) {
    const movenum = numcolumns * rowIdx + seatIdx;
    return movenum < pathLength ? movenum : null;
  }

  const row = rounds[rowIdx];
  if (!Array.isArray(row) || seatIdx >= row.length) {
    return pathIndexFromWireRow(rowIdx, seatIdx, pathLength, layout, path);
  }

  if (row[seatIdx] === null) {
    return pathIndexFromWireRow(rowIdx, seatIdx, pathLength, layout, path);
  }

  if (layout.model === "simultaneous") {
    return rowIdx < pathLength ? rowIdx : null;
  }

  if (
    layout.model === "sequenced" &&
    isStackAlignedRounds(rounds, pathLength)
  ) {
    return rowIdx < pathLength ? rowIdx : null;
  }

  const stackPathIdx = pathIndexFromStackIndexForSequencedCell(
    engine,
    rowIdx,
    seatIdx,
    pathLength
  );
  if (stackPathIdx !== null) {
    return stackPathIdx;
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
 * @param {{ pathLength: number, layout: MoveTableLayout, engine?: { getRounds?: () => unknown[][], getPlies?: () => unknown[] }, path?: { move?: unknown }[][] | null }} ctx
 * @returns {number}
 */
export function moveTableRowCount({ pathLength, layout, engine, path = null }) {
  const { numcolumns, useRoundGrid } = layout;
  if (!useRoundGrid) {
    return Math.ceil(pathLength / numcolumns);
  }
  const rounds = getRoundsForLayout(engine, layout, pathLength, path);
  if (Array.isArray(rounds) && rounds.length > 0) {
    if (layout.model === "simultaneous") {
      return Math.min(rounds.length, pathLength);
    }
    if (isStackAlignedRounds(rounds, pathLength)) {
      return Math.min(rounds.length, pathLength);
    }
    return rounds.length;
  }
  return Math.ceil(pathLength / numcolumns);
}
