import { GameFactory } from "@abstractplay/gameslib";

export function assertValidMoveHasComplete(v, move) {
  if (v.valid && v.complete == null) {
    throw new Error(
      `validateMove returned valid without complete for move: ${move}`
    );
  }
}

function createProbeEngine(gameEngine, metaGame) {
  if (metaGame && typeof gameEngine.cheapSerialize === "function") {
    return GameFactory(metaGame, gameEngine.cheapSerialize());
  }
  if (typeof gameEngine.clone === "function") {
    const probe = gameEngine.clone();
    if (typeof probe.load === "function") probe.load();
    return probe;
  }
  throw new Error(`Cannot probe move without metaGame or clone(): ${metaGame}`);
}

export function requiresPartialExplorationApply(gameEngine, move, metaGame) {
  const v = gameEngine.validateMove(move);
  if (!v.valid) return false;
  assertValidMoveHasComplete(v, move);
  if (v.complete === 1) return false;

  try {
    createProbeEngine(gameEngine, metaGame).move(move, {
      trusted: true,
      partial: false,
      emulation: true,
    });
    return false;
  } catch {
    return true;
  }
}

export function isPartialExplorationMove(
  gameEngine,
  move,
  { userCompleted = false, metaGame } = {}
) {
  const v = gameEngine.validateMove(move);
  if (!v.valid) return false;
  assertValidMoveHasComplete(v, move);
  if (v.complete === 1) return false;

  const renderPartial = v.complete < 1 && v.canrender === true;
  if (!renderPartial) return false;

  if (!userCompleted) return true;

  return requiresPartialExplorationApply(gameEngine, move, metaGame);
}

export function validateExplorationMove(gameEngine, move, { metaGame } = {}) {
  const v = gameEngine.validateMove(move);
  if (!v.valid) return { valid: false, partial: false };
  assertValidMoveHasComplete(v, move);
  return {
    valid: true,
    partial: requiresPartialExplorationApply(gameEngine, move, metaGame),
  };
}

export function isPersistableExplorationMove(gameEngine, move, metaGame) {
  const { valid, partial } = validateExplorationMove(gameEngine, move, {
    metaGame,
  });
  return valid && !partial;
}

export function applyExplorationMove(
  gameEngine,
  move,
  { emulation = false, metaGame } = {}
) {
  const { valid, partial } = validateExplorationMove(gameEngine, move, {
    metaGame,
  });
  if (!valid) {
    throw new Error(`Invalid exploration move: ${move}`);
  }
  gameEngine.move(move, { trusted: true, partial, emulation });
}

export function filterPersistableExplorationTree(
  gameEngine,
  children,
  metaGame
) {
  if (!Array.isArray(children)) return [];
  const result = [];
  for (const child of children) {
    if (!child?.move) continue;
    if (!isPersistableExplorationMove(gameEngine, child.move, metaGame)) continue;
    try {
      applyExplorationMove(gameEngine, child.move, { metaGame });
      result.push({
        ...child,
        children: filterPersistableExplorationTree(
          gameEngine,
          child.children || [],
          metaGame
        ),
      });
      gameEngine.stack.pop();
      gameEngine.load();
      gameEngine.gameover = false;
      gameEngine.winner = [];
    } catch (err) {
      console.warn(
        `Skipping unpersistable exploration branch: ${child.move}`,
        err
      );
    }
  }
  return result;
}
