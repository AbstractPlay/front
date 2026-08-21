/** @typedef {"sequential" | "simultaneous" | "sequenced" | "skip-turn"} TurnModel */

/**
 * Resolve turn model for move-table layout (matches recranks turnModelFromRecord order).
 * @param {{ game?: { simultaneous?: boolean }, engine?: { turnModel?: () => TurnModel }, gameRec?: { header?: Record<string, unknown> } }} ctx
 * @returns {TurnModel}
 */
export function effectiveTurnModel({ game, engine, gameRec }) {
  const fromHeader = gameRec?.header?.["turn-model"];
  if (
    fromHeader === "sequential" ||
    fromHeader === "simultaneous" ||
    fromHeader === "sequenced" ||
    fromHeader === "skip-turn"
  ) {
    return fromHeader;
  }
  if (typeof engine?.turnModel === "function") {
    const fromEngine = engine.turnModel();
    if (
      fromEngine === "sequential" ||
      fromEngine === "simultaneous" ||
      fromEngine === "sequenced" ||
      fromEngine === "skip-turn"
    ) {
      return fromEngine;
    }
  }
  if (game?.simultaneous) return "simultaneous";
  return "sequential";
}
