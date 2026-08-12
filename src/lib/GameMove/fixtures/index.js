import { carnacContracts } from "./carnac.js";
import { estateContracts } from "./estate.js";
import { jacynthContracts } from "./jacynth.js";
import { pinchContracts } from "./pinch.js";

/**
 * Registry of real-engine exploration contract scenarios.
 *
 * To add a regression case:
 * 1. Add inline state + move(s) in a new file under fixtures/ (or extend an existing one).
 * 2. Export a contract object with id, metaGame, state, move, expectations.
 * 3. Append to EXPLORATION_CONTRACTS below.
 *
 * Run by [`bin/test-exploration-contracts.mjs`](../../../../bin/test-exploration-contracts.mjs)
 * (`npm run test:engines`). state: JSON string passed to GameFactory, or null for a fresh game.
 *
 * metaGame must exist in the pinned gameslib registry (see ci-deps.json).
 */
export const EXPLORATION_CONTRACTS = [
  ...carnacContracts,
  ...estateContracts,
  ...jacynthContracts,
  ...pinchContracts,
];

export { CARNAC_TIP_STATE } from "./carnac.js";
export { JACYNTH_STATE } from "./jacynth.js";
