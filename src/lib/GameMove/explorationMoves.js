import { GameFactory } from "@abstractplay/gameslib";

export function assertValidMoveHasComplete(v, move) {
  if (v.valid && v.complete == null) {
    throw new Error(
      `validateMove returned valid without complete for move: ${move}`
    );
  }
}

export function toSimultaneousMoveString(singleMove, playerIndex, numPlayers) {
  const parts = Array(numPlayers).fill("");
  parts[playerIndex] = singleMove ?? "";
  return parts.join(",");
}

function normalizeMoveContext(options = {}) {
  if (typeof options === "string") {
    return { metaGame: options };
  }
  return options ?? {};
}

function singlePlayerMove(move, context) {
  const ctx = normalizeMoveContext(context);
  if (!ctx.simultaneous || ctx.playerIndex == null || ctx.numPlayers == null) {
    return move;
  }
  if (typeof move === "string" && move.includes(",")) {
    const parts = move.split(",");
    if (parts.length === ctx.numPlayers) {
      return parts[ctx.playerIndex] ?? "";
    }
  }
  return move;
}

function wireMoveForEngine(move, context) {
  const ctx = normalizeMoveContext(context);
  if (!ctx.simultaneous || ctx.playerIndex == null || ctx.numPlayers == null) {
    return move;
  }
  if (typeof move === "string" && move.includes(",")) {
    const parts = move.split(",");
    if (parts.length === ctx.numPlayers) {
      return move;
    }
  }
  const single = singlePlayerMove(move, ctx);
  return toSimultaneousMoveString(single, ctx.playerIndex, ctx.numPlayers);
}

function validateMoveForExploration(gameEngine, move, context) {
  const ctx = normalizeMoveContext(context);
  const single = singlePlayerMove(move, ctx);
  if (ctx.simultaneous && ctx.playerIndex != null) {
    return gameEngine.validateMove(single, ctx.playerIndex + 1);
  }
  return gameEngine.validateMove(single);
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

export function requiresPartialExplorationApply(gameEngine, move, context) {
  const ctx = normalizeMoveContext(context);
  const v = validateMoveForExploration(gameEngine, move, ctx);
  if (!v.valid) return false;
  assertValidMoveHasComplete(v, singlePlayerMove(move, ctx));
  if (v.complete === 1) return false;
  if (ctx.simultaneous && v.complete !== 1) return true;

  try {
    createProbeEngine(gameEngine, ctx.metaGame).move(wireMoveForEngine(move, ctx), {
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
  options = {}
) {
  const ctx = normalizeMoveContext(options);
  const { userCompleted = false } = ctx;
  const v = validateMoveForExploration(gameEngine, move, ctx);
  if (!v.valid) return false;
  assertValidMoveHasComplete(v, singlePlayerMove(move, ctx));
  if (v.complete === 1) return false;
  // gameslib complete:-1 — always partial while editing (even without canrender)
  if (v.complete === -1) {
    if (!userCompleted) return true;
    return requiresPartialExplorationApply(gameEngine, move, ctx);
  }

  // complete === 0 — legal full apply, but UI may defer commit until Complete move
  if (!v.canrender) return false;
  if (!userCompleted) return true;

  return requiresPartialExplorationApply(gameEngine, move, ctx);
}

export function validateExplorationMove(gameEngine, move, options = {}) {
  const ctx = normalizeMoveContext(options);
  const v = validateMoveForExploration(gameEngine, move, ctx);
  if (!v.valid) return { valid: false, partial: false };
  assertValidMoveHasComplete(v, singlePlayerMove(move, ctx));
  return {
    valid: true,
    partial: requiresPartialExplorationApply(gameEngine, move, ctx),
  };
}

export function isPersistableExplorationMove(
  gameEngine,
  move,
  optionsOrMetaGame
) {
  const ctx = normalizeMoveContext(optionsOrMetaGame);
  const { valid, partial } = validateExplorationMove(gameEngine, move, ctx);
  return valid && !partial;
}

export function applyExplorationMove(
  gameEngine,
  move,
  options = {}
) {
  const ctx = normalizeMoveContext(options);
  const { valid, partial } = validateExplorationMove(gameEngine, move, ctx);
  if (!valid) {
    throw new Error(`Invalid exploration move: ${move}`);
  }
  const wireMove = wireMoveForEngine(move, ctx);
  gameEngine.move(wireMove, { trusted: true, partial, emulation: true });
}

export function filterPersistableExplorationTree(
  gameEngine,
  children,
  optionsOrMetaGame
) {
  const ctx = normalizeMoveContext(optionsOrMetaGame);
  if (!Array.isArray(children)) return [];
  const result = [];
  for (const child of children) {
    if (!child?.move) continue;
    if (!isPersistableExplorationMove(gameEngine, child.move, ctx)) continue;
    try {
      applyExplorationMove(gameEngine, child.move, ctx);
      result.push({
        ...child,
        children: filterPersistableExplorationTree(
          gameEngine,
          child.children || [],
          ctx
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

export function explorationMoveContext(game) {
  return {
    metaGame: game.metaGame,
    simultaneous: game.simultaneous,
    playerIndex: game.me,
    numPlayers: game.numPlayers,
  };
}
