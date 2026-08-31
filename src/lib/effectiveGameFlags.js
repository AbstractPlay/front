import { gameinfo, resolveGameFlags } from "@abstractplay/gameslib";

/** Effective flags for an active engine instance (preferred). */
export function effectiveFlags(engine, metaGame) {
  if (engine != null && typeof engine.getFlags === "function") {
    return engine.getFlags();
  }
  return gameinfo.get(metaGame)?.flags ?? [];
}

/** Effective flags when configuring a challenge (no engine yet). */
export function effectiveFlagsForChallenge(
  metaGame,
  { variants = [], numplayers } = {}
) {
  if (typeof resolveGameFlags === "function") {
    return resolveGameFlags(metaGame, { variants, numplayers });
  }
  return gameinfo.get(metaGame)?.flags ?? [];
}

export function flagSetIncludes(flags, name) {
  return Array.isArray(flags) && flags.includes(name);
}

/** Copy session flags from the engine onto the front game record. */
export function applyEffectiveFlags(game0, engine, metaGame) {
  const info = gameinfo.get(metaGame);
  const flags = effectiveFlags(engine, metaGame);

  game0.simultaneous = flagSetIncludes(info?.flags, "simultaneous");
  game0.pie =
    flagSetIncludes(flags, "pie") || flagSetIncludes(flags, "pie-even");
  game0.pieEven = flagSetIncludes(flags, "pie-even");
  game0.canCheck = flagSetIncludes(flags, "check");
  game0.sharedPieces = flagSetIncludes(flags, "shared-pieces");
  game0.customColours = flagSetIncludes(flags, "custom-colours");
  game0.customButtons = flagSetIncludes(flags, "custom-buttons");
  game0.customRandom = flagSetIncludes(flags, "custom-randomization");
  game0.rotate90 = flagSetIncludes(flags, "rotate90");
  game0.playerStashes = flagSetIncludes(flags, "player-stashes");
  game0.sharedStash = flagSetIncludes(flags, "shared-stash");
  game0.noMoves = flagSetIncludes(flags, "no-moves");
  game0.automove = flagSetIncludes(flags, "automove");
  game0.autopass = flagSetIncludes(flags, "autopass");
  game0.noExploreFlag = flagSetIncludes(flags, "no-explore");
  game0.stackExpanding = flagSetIncludes(flags, "stacking-expanding");
}

/** Stop exploration automove at the pie-even opening decision (stack depth 2). */
export function blocksExplorationAutomoveForPieEven(game, engine) {
  if (!game?.pieEven) {
    return false;
  }
  const stack = engine?.state?.()?.stack;
  return Array.isArray(stack) && stack.length === 2;
}
