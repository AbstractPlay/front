import { getFocusNode } from "./Lab/exploration";
import { isTeachingChallengeEligible } from "./teachingModeChallenge";

/** Mirrors backend teaching eligibility for start-position challenges. */
export function isStartPositionChallengeEligible(
  metaGame,
  playerCount,
  variants = undefined
) {
  return isTeachingChallengeEligible(metaGame, playerCount, variants);
}

export function buildStartPositionPayload(state) {
  if (typeof state !== "string" || state.trim() === "") {
    throw new Error("Start position state is required.");
  }
  return { startPosition: { state } };
}

export function mergeStartPositionIntoChallenge(challenge, state) {
  return { ...challenge, ...buildStartPositionPayload(state) };
}

/**
 * @param {{ game: object, nodes: object[], focus: object }} session
 */
export function buildStartPositionFromLabSession({ game, nodes, focus }) {
  if (!game?.metaGame || !nodes?.length || !focus) {
    throw new Error("Cannot build start position from this session.");
  }
  const state = getFocusNode(nodes, game, focus)?.state;
  if (!state) {
    throw new Error("Start position state is missing.");
  }
  return {
    metaGame: game.metaGame,
    state,
    variants: game.selectedVariants ?? [],
    playerCount: 2,
  };
}

/**
 * @param {{ game: object, nodes: object[], focus: object }} session
 */
export function buildStartPositionFromGameMoveSession({ game, nodes, focus }) {
  return buildStartPositionFromLabSession({ game, nodes, focus });
}
