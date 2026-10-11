import { gameinfo, GameFactory } from "@abstractplay/gameslib";

const ALLOWED_TURN_MODELS = new Set(["sequential", "sequenced", "skip-turn"]);

/** True when the UI may offer teaching mode on a new challenge. */
export function isTeachingChallengeEligible(
  metaGame,
  playerCount,
  variants = undefined
) {
  const count = Number(playerCount);
  if (!Number.isFinite(count) || count !== 2 || metaGame == null || metaGame === "") {
    return false;
  }
  const info = gameinfo.get(metaGame);
  if (!info) {
    return false;
  }
  if (info.flags.includes("simultaneous")) {
    return false;
  }
  try {
    const engine =
      info.playercounts.length > 1
        ? GameFactory(metaGame, count, variants)
        : GameFactory(metaGame, undefined, variants);
    if (!engine) {
      return false;
    }
    const turnModel =
      typeof engine.turnModel === "function" ? engine.turnModel() : "sequential";
    if (turnModel === "simultaneous") {
      return false;
    }
    return ALLOWED_TURN_MODELS.has(turnModel);
  } catch {
    return false;
  }
}

export function challengeRatedForPayload({
  rated,
  forceUnrated,
  teachingMode,
}) {
  if (forceUnrated || teachingMode === true) {
    return false;
  }
  return rated;
}

export function challengeTeachingModeForPayload(teachingMode, eligible) {
  return teachingMode === true && eligible === true;
}

export function isTeachingUndoReview(game) {
  return game?.teachingUndo != null;
}

/** Pre-move notice that the opponent may invoke pie; hidden in teaching games. */
export function showPieSeatSwapNotice(game, engine) {
  if (game?.teachingMode === true || !game?.pie || game.pieInvoked) {
    return false;
  }
  if (typeof engine?.isPieTurn === "function") {
    return engine.isPieTurn();
  }
  return engine?.stack?.length === 2;
}

/** Live tip during cooperative undo review — hide normal move UI on all layouts. */
export function isTeachingUndoReviewAtCurrentTip(game, uiState) {
  return uiState === 0 && isTeachingUndoReview(game);
}

export function teachingPlayerRole(game, userId) {
  if (!game?.teachingMode || !game.teachingUndo || !userId) {
    return null;
  }
  const seat = game.players.findIndex((p) => p.id === userId);
  if (seat < 0) {
    return null;
  }
  const { grantorSeat, reviewerSeat } = game.teachingUndo;
  if (seat === reviewerSeat) {
    return "reviewer";
  }
  if (seat === grantorSeat) {
    return "grantor";
  }
  return "other";
}
