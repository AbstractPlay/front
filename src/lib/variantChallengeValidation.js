import { gameinfo, GameFactory, validateVariantSelection } from "@abstractplay/gameslib";

/**
 * Variant definitions for challenge UI (production-filtered when applicable).
 */
export function getChallengeVariantDefs(metaGame) {
  const info = gameinfo.get(metaGame);
  if (!info) {
    return [];
  }
  const gameEngine =
    info.playercounts.length > 1
      ? GameFactory(info.uid, 2)
      : GameFactory(info.uid);
  if (!gameEngine) {
    return [];
  }
  if (typeof gameEngine.challengeVariants === "function") {
    return gameEngine.challengeVariants() ?? [];
  }
  return gameEngine.allvariants() ?? [];
}

/**
 * Validate selected variant uids against declarative constraints in gameinfo.
 */
export function validateChallengeVariantSelection(metaGame, selectedVariants) {
  const defs = getChallengeVariantDefs(metaGame);
  if (defs.length === 0) {
    return { ok: true };
  }
  return validateVariantSelection(defs, selectedVariants);
}
