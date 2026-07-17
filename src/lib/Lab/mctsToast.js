/** Build a short toast summary from MCTS search results. */
export function formatMctsToast(result, t) {
  if (!result?.move) return t("MctsNoResult");

  let message = t("MctsToast", {
    move: result.move,
    winRate: result.winRate,
    iterations: result.iterations,
    elapsedSec: result.elapsedSec,
    visitShare: result.visitShare,
  });

  if (
    result.secondBest &&
    result.marginWinRate !== null &&
    Math.abs(result.marginWinRate) < 10
  ) {
    message +=
      " " +
      t("MctsToastCloseCall", {
        move: result.secondBest.move,
        winRate: result.secondBest.winRate,
      });
  } else if (result.marginWinRate !== null && result.marginWinRate >= 3) {
    message += " " + t("MctsToastMargin", { margin: result.marginWinRate });
  }

  if (result.lowConfidence) {
    message += " " + t("MctsToastLowConfidence");
  }

  if (result.exploredMoveCount < result.legalMoveCount) {
    message +=
      " " +
      t("MctsToastCoverage", {
        explored: result.exploredMoveCount,
        total: result.legalMoveCount,
      });
  }

  return message;
}

/** Log full MCTS stats to the console for later reference. */
export function logMctsStats(result, { metaGame, rootPlayer } = {}) {
  if (!result?.move) return;

  const header = metaGame
    ? `Playground MCTS — ${metaGame} (player ${rootPlayer + 1})`
    : "Playground MCTS";

  console.group(header);
  console.log("Recommendation", {
    move: result.move,
    winRate: result.winRate,
    visits: result.visits,
    visitShare: result.visitShare,
  });
  console.log("Search", {
    iterations: result.iterations,
    elapsedSec: result.elapsedSec,
    simulationsPerSec: result.simulationsPerSec,
    exploredMoveCount: result.exploredMoveCount,
    legalMoveCount: result.legalMoveCount,
    concentrationRatio: result.concentrationRatio,
  });
  if (result.lowConfidence) {
    console.warn(
      "Low confidence — many legal moves dilute the search. Try a longer think time."
    );
  }
  if (result.skippedMoves?.length) {
    console.warn("Skipped root moves", result.skippedMoves);
  }
  if (result.secondBest) {
    console.log("Runner-up", result.secondBest);
    if (result.marginWinRate !== null) {
      console.log("Margin (win rate)", `${result.marginWinRate}%`);
    }
  }
  if (result.rankings?.length) {
    console.table(result.rankings.slice(0, 20));
    if (result.rankings.length > 20) {
      console.log(`… and ${result.rankings.length - 20} more ranked moves`);
    }
  }
  console.groupEnd();
}

/** Log failure diagnostics when MCTS cannot recommend a move. */
export function logMctsFailure(err, context = {}) {
  console.group("Playground MCTS failed");
  console.error(err);
  if (err?.mctsDiagnostics) {
    console.log("Diagnostics", err.mctsDiagnostics);
  }
  if (Object.keys(context).length > 0) {
    console.log("Context", context);
  }
  console.groupEnd();
}
