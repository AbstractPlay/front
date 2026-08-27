import { gameinfo } from "@abstractplay/gameslib";
import { callAuthApi } from "./api";

/** Whether the catalog title supports `playercounts` including 1. */
export function soloPlaySupported(metaGame) {
  const info = gameinfo.get(metaGame);
  return info !== undefined && info.playercounts.includes(1);
}

export function isSoloGame(game) {
  return game?.numPlayers === 1;
}

export function soloRecordHeader(gameRec) {
  return gameRec?.header;
}

export function soloOutcomeType(gameRec) {
  return soloRecordHeader(gameRec)?.["outcome-type"];
}

export function soloChallengeSeed(gameRec) {
  const seed = soloRecordHeader(gameRec)?.["challenge-seed"];
  return typeof seed === "string" && seed.length > 0 ? seed : undefined;
}

export function soloScoreDirection(gameRec) {
  return soloRecordHeader(gameRec)?.["score-direction"] ?? "higher";
}

export function soloScoreLabel(gameRec) {
  return soloRecordHeader(gameRec)?.["score-label"];
}

export function soloPlayerFromRecord(gameRec) {
  return soloRecordHeader(gameRec)?.players?.[0];
}

export function formatElapsedMs(ms) {
  if (ms === undefined || ms === null || Number.isNaN(ms)) {
    return "";
  }
  const value = Math.max(0, Math.round(ms));
  if (value < 60_000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.floor((value % 60_000) / 1000);
  return `${minutes}:${seconds.toString().padStart(10, "0").slice(-2)}`;
}

export function formatGradeLabel(grade, t) {
  if (!grade) {
    return "";
  }
  return t(`solo.grades.${grade}`, { defaultValue: grade });
}

/**
 * Format a solo outcome for display from an archived record or live engine hooks.
 * @param {{ gameRec?: object, engine?: object, metaGame?: string, t: Function }} opts
 */
export function formatSoloOutcome({ gameRec, engine, metaGame, t }) {
  const header = gameRec?.header;
  const outcomeType = header?.["outcome-type"];
  const player = header?.players?.[0] ?? {};

  const grade =
    player.grade ??
    (typeof engine?.getPlayerGrade === "function"
      ? engine.getPlayerGrade(1)
      : undefined);
  const passed =
    player.passed ??
    (typeof engine?.getBinaryPassed === "function"
      ? engine.getBinaryPassed(1)
      : undefined);
  const score =
    player.score ??
    (typeof engine?.getPlayerScore === "function"
      ? engine.getPlayerScore(1)
      : undefined);
  const elapsedMs =
    typeof engine?.getPlayerElapsedMs === "function"
      ? engine.getPlayerElapsedMs()
      : undefined;

  const resolvedType =
    outcomeType ??
    (typeof engine?.getSoloOutcomeMeta === "function"
      ? engine.getSoloOutcomeMeta()?.outcomeType
      : undefined);

  if (resolvedType === "binary") {
    if (passed === true) {
      return t("solo.outcome.passed");
    }
    if (passed === false) {
      return t("solo.outcome.failed");
    }
  }

  if (resolvedType === "graded" && grade) {
    return t("solo.outcome.grade", {
      grade: formatGradeLabel(grade, t),
    });
  }

  if (resolvedType === "timed" && elapsedMs !== undefined) {
    return t("solo.outcome.timed", { time: formatElapsedMs(elapsedMs) });
  }

  if (resolvedType === "score" && score !== undefined) {
    const direction = header?.["score-direction"] ?? "higher";
    const label = header?.["score-label"] ?? t("solo.outcome.scoreFallback");
    const hint =
      direction === "lower"
        ? t("solo.outcome.lowerIsBetter")
        : t("solo.outcome.higherIsBetter");
    return t("solo.outcome.score", { score, label, hint });
  }

  if (score !== undefined) {
    return t("solo.outcome.scoreShort", { score });
  }

  return t("GameIsOver");
}

export function soloVariantSummaryKey(metaUid, variantUids = []) {
  const sorted = [...variantUids].sort();
  if (sorted.length === 0) {
    return `${metaUid} (no variants)`;
  }
  return `${metaUid} (${sorted.join("|")})`;
}

export function filterSoloMetaStats(summary, metaFilter) {
  const stats = summary?.soloMetaStats ?? {};
  if (!metaFilter) {
    return Object.entries(stats);
  }
  return Object.entries(stats).filter(([key]) =>
    key === metaFilter || key.startsWith(`${metaFilter} (`)
  );
}

export function filterSoloSeedBoards(summary, metaFilter) {
  const boards = summary?.soloSeedBoards ?? [];
  if (!metaFilter) {
    return boards;
  }
  return boards.filter((board) => board.metaUid === metaFilter);
}

/** Start a solo game via auth API; returns parsed response body. */
export async function startSoloGameRequest(pars) {
  const res = await callAuthApi("start_solo_game", pars);
  if (!res) {
    throw new Error("Authentication required");
  }
  if (res.status !== 200) {
    let message = `Failed to start solo game (${res.status})`;
    try {
      const result = await res.json();
      if (result?.message) {
        message = result.message;
      } else if (result?.body) {
        message = result.body;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  const result = await res.json();
  return JSON.parse(result.body);
}

export function soloPlayNavigatePath(body, fallbackMetaGame) {
  const metaGame = body.metaGameUid ?? fallbackMetaGame;
  return `/move/${metaGame}/0/${body.gameId}`;
}

export function buildSoloShareUrl(metaGame, challengeSeed) {
  if (!challengeSeed) {
    return undefined;
  }
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://play.abstractplay.com";
  const params = new URLSearchParams({ seed: challengeSeed });
  return `${origin}/games/${metaGame}?${params.toString()}`;
}
