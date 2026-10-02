/** Simultaneous seat-mode round buffer for Lab (front-owned; not shared with GameMove). */

/** Gameslib simultaneous wire placeholder for eliminated seats (U+0091). */
export const LAB_SIM_ELIM_CHAR = "\u0091";

/**
 * @param {string | undefined | null} partialMove
 * @param {number} numPlayers
 * @returns {string[]}
 */
export function splitPartialRow(partialMove, numPlayers) {
  if (partialMove === undefined || partialMove === null || partialMove === "") {
    return Array(numPlayers).fill("");
  }
  const moves = partialMove.split(",");
  while (moves.length < numPlayers) {
    moves.push("");
  }
  return moves.slice(0, numPlayers);
}

/**
 * @param {string[]} moves
 * @returns {string}
 */
export function joinPartialRow(moves) {
  return moves.join(",");
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {number} seat 1-based
 */
export function seatEliminated(engine, seat) {
  return (
    typeof engine?.isEliminated === "function" && engine.isEliminated(seat)
  );
}

/**
 * When exactly one seat is not eliminated, return that seat (1-based); otherwise null.
 *
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @returns {number | null}
 */
export function soleActiveSeat(engine) {
  if (!engine) {
    return null;
  }
  let sole = null;
  for (let seat = 1; seat <= engine.numplayers; seat++) {
    if (seatEliminated(engine, seat)) {
      continue;
    }
    if (sole !== null) {
      return null;
    }
    sole = seat;
  }
  return sole;
}

/**
 * Seat used for validateMove / handleClickSimultaneous on comma-vector games.
 *
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {number} activeSeat 1-based UI seat
 */
export function partialMoveSeat(engine, activeSeat) {
  if (
    engine &&
    engine.phase === "place" &&
    typeof engine.turnModel === "function" &&
    engine.turnModel() === "sequenced"
  ) {
    return engine.currplayer;
  }
  return activeSeat;
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {number} numPlayers
 * @returns {boolean[]}
 */
export function initialSeatToMove(engine, numPlayers) {
  const arr = [];
  for (let i = 1; i <= numPlayers; i++) {
    arr.push(!seatEliminated(engine, i));
  }
  return arr;
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {boolean[]} toMove
 * @returns {boolean[]} new array if changed
 */
export function syncSeatToMoveAfterElimination(engine, toMove) {
  const next = [...toMove];
  let changed = false;
  for (let i = 0; i < engine.numplayers; i++) {
    if (seatEliminated(engine, i + 1) && next[i]) {
      next[i] = false;
      changed = true;
    }
  }
  return changed ? next : toMove;
}

/**
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {number} seatIndex 0-based active seat
 * @param {boolean[]} toMove
 */
export function isSeatSubmitBlocked(engine, seatIndex, toMove) {
  const seat = seatIndex + 1;
  if (seatEliminated(engine, seat)) {
    return true;
  }
  return !toMove[seatIndex];
}

/**
 * @param {string} partialMove
 * @param {number} seat 1-based viewer
 * @param {number} numPlayers
 */
export function maskPartialMoveForSeat(partialMove, seat, numPlayers) {
  const moves = splitPartialRow(partialMove, numPlayers);
  return moves
    .map((m, i) => (i === seat - 1 ? m : m === "" ? "" : "•••"))
    .join(",");
}

/**
 * @param {{
 *   engine: import("@abstractplay/gameslib").GameBase;
 *   numPlayers: number;
 *   seatIndex: number;
 *   fragment: string;
 *   partialMove?: string;
 *   toMove: boolean[];
 * }} params
 */
export function submitSeatRound({
  engine,
  numPlayers,
  seatIndex,
  fragment,
  partialMove,
  toMove,
}) {
  const moves = splitPartialRow(partialMove, numPlayers);
  const toMoveArr = [...toMove];
  const seat = seatIndex + 1;

  if (seatEliminated(engine, seat)) {
    throw new Error("This seat is eliminated and cannot submit a move.");
  }
  if (!toMoveArr[seatIndex]) {
    throw new Error("You have already submitted your move for this round.");
  }

  moves[seatIndex] = fragment;
  toMoveArr[seatIndex] = false;

  for (let i = 0; i < numPlayers; i++) {
    if (seatEliminated(engine, i + 1)) {
      moves[i] = LAB_SIM_ELIM_CHAR;
    }
  }

  let filled = 0;
  for (let i = 0; i < numPlayers; i++) {
    if (moves[i] !== "") {
      filled++;
    }
  }

  const combined = joinPartialRow(moves);

  if (filled < numPlayers) {
    engine.move(combined, { partial: true });
    return {
      committed: false,
      partialMove: combined,
      toMove: toMoveArr,
      combinedWire: combined,
    };
  }

  engine.move(combined);
  const freshToMove = initialSeatToMove(engine, numPlayers);
  return {
    committed: true,
    partialMove: joinPartialRow(Array(numPlayers).fill("")),
    toMove: freshToMove,
    combinedWire: combined,
    serialized: engine.serialize(),
  };
}

/** @param {import("@abstractplay/gameslib").GameBase} engine */
export function createFreshRoundBuffer(engine) {
  return {
    partialMove: joinPartialRow(Array(engine.numplayers).fill("")),
    toMove: initialSeatToMove(engine, engine.numplayers),
  };
}

/**
 * Apply in-progress partial wire to engine for board preview (trusted).
 *
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {string | undefined} partialMove
 */
export function applyPartialRoundPreview(engine, partialMove) {
  if (!partialMove || partialMove.length < engine.numplayers - 1) {
    return;
  }
  const hasContent = splitPartialRow(partialMove, engine.numplayers).some(
    (m) => m !== "" && m !== LAB_SIM_ELIM_CHAR
  );
  if (!hasContent) {
    return;
  }
  engine.move(partialMove, { partial: true, trusted: true });
}

/**
 * @param {object} game
 * @param {import("@abstractplay/gameslib").GameBase} engine
 * @param {{ partialMove?: string, toMove?: boolean[] }} [buffer]
 */
export function applySimultaneousGameFields(game, engine, buffer) {
  const round = buffer ?? createFreshRoundBuffer(engine);
  const synced = syncSeatToMoveAfterElimination(engine, round.toMove);
  game.simultaneous = true;
  game.partialMove = round.partialMove;
  game.toMove = synced;
  const loneSeat = soleActiveSeat(engine);
  if (loneSeat != null) {
    game.me = loneSeat - 1;
    game.labActiveSeat = loneSeat;
  }
  game.canSubmit = synced[game.me] === true;
}
