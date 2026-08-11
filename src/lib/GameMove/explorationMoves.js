export function isMoveInLegalList(gameEngine, move) {
  if (typeof gameEngine.moves !== "function") return false;
  const legal = gameEngine.moves();
  if (legal.includes(move)) return true;
  if (typeof gameEngine.sameMove === "function") {
    return legal.some((m) => gameEngine.sameMove(move, m));
  }
  return false;
}

// Whether a move string is a complete exploration branch (not a render-only prefix).
export function validateExplorationMove(gameEngine, move) {
  const v = gameEngine.validateMove(move);
  if (!v.valid) return { valid: false, partial: false };
  if (v.complete === 1) return { valid: true, partial: false };
  if (isMoveInLegalList(gameEngine, move)) return { valid: true, partial: false };
  if (v.complete < 1) return { valid: true, partial: true };
  return { valid: true, partial: false };
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
