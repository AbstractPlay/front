export function assertValidMoveHasComplete(v, move) {
  if (v.valid && v.complete == null) {
    throw new Error(
      `validateMove returned valid without complete for move: ${move}`
    );
  }
}

export function requiresPartialExplorationApply(gameEngine, move) {
  const v = gameEngine.validateMove(move);
  if (!v.valid) return false;
  assertValidMoveHasComplete(v, move);
  if (v.complete === 1) return false;

  if (typeof gameEngine.clone !== "function") {
    throw new Error(`Game engine missing clone() for move: ${move}`);
  }
  try {
    gameEngine
      .clone()
      .move(move, { trusted: true, partial: false, emulation: true });
    return false;
  } catch {
    return true;
  }
}

export function isPartialExplorationMove(
  gameEngine,
  move,
  { userCompleted = false } = {}
) {
  const v = gameEngine.validateMove(move);
  if (!v.valid) return false;
  assertValidMoveHasComplete(v, move);
  if (v.complete === 1) return false;

  const renderPartial = v.complete < 1 && v.canrender === true;
  if (!renderPartial) return false;

  if (!userCompleted) return true;

  return requiresPartialExplorationApply(gameEngine, move);
}

export function validateExplorationMove(gameEngine, move) {
  const v = gameEngine.validateMove(move);
  if (!v.valid) return { valid: false, partial: false };
  assertValidMoveHasComplete(v, move);
  return {
    valid: true,
    partial: requiresPartialExplorationApply(gameEngine, move),
  };
}

export function isPersistableExplorationMove(gameEngine, move) {
  const { valid, partial } = validateExplorationMove(gameEngine, move);
  return valid && !partial;
}

export function applyExplorationMove(gameEngine, move, { emulation = false } = {}) {
  const { valid, partial } = validateExplorationMove(gameEngine, move);
  if (!valid) {
    throw new Error(`Invalid exploration move: ${move}`);
  }
  gameEngine.move(move, { trusted: true, partial, emulation });
}

export function filterPersistableExplorationTree(gameEngine, children) {
  if (!Array.isArray(children)) return [];
  const result = [];
  for (const child of children) {
    if (!child?.move) continue;
    if (!isPersistableExplorationMove(gameEngine, child.move)) continue;
    try {
      applyExplorationMove(gameEngine, child.move);
      result.push({
        ...child,
        children: filterPersistableExplorationTree(
          gameEngine,
          child.children || []
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
