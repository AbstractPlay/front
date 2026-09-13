import { expandVariantLabels } from "@abstractplay/gameslib";

/**
 * @param {string} metaGame
 * @param {string[]} vars
 * @returns {string[]}
 */
export function expandVariants(metaGame, vars) {
  const playerCount = 2;
  return expandVariantLabels(metaGame, playerCount, vars ?? []);
}
