import { compareByGlickoLow, glickoRatingLow } from "./glickoDisplay";
import { getPlayerTimeoutStats } from "./summaryFetch";

export const PROFILE_TABS = [
  {
    id: "competition",
    nameKey: "player.tabs.competition",
    modules: ["ratings", "opps", "counts"],
  },
  {
    id: "activity",
    nameKey: "player.tabs.activity",
    modules: ["activity", "timeouts", "response"],
  },
  {
    id: "games",
    nameKey: "player.tabs.games",
    modules: ["stars", "designed", "coded", "highlights"],
  },
  {
    id: "record",
    nameKey: "player.tabs.record",
    modules: ["history", "tournaments"],
  },
];

export const DEFAULT_PROFILE_TAB = "competition";

export const PROFILE_TAB_IDS = PROFILE_TABS.map((tab) => tab.id);

export function isValidProfileTab(tab) {
  return PROFILE_TAB_IDS.includes(tab);
}

/** Tab id from URL hash when present and valid; otherwise `null` (use stored tab). */
export function playerTabOverrideFromHash(hash) {
  if (!hash || hash === "#") {
    return null;
  }
  const tab = hash.startsWith("#") ? hash.slice(1) : hash;
  return isValidProfileTab(tab) ? tab : null;
}

export function playerTabHash(tabId) {
  return tabId;
}

export const MODULE_NAME_KEYS = {
  stars: "player.modules.stars",
  coded: "player.modules.coded",
  designed: "player.modules.designed",
  ratings: "player.modules.ratings",
  counts: "player.modules.counts",
  opps: "player.modules.opponents",
  activity: "player.modules.activity",
  timeouts: "player.modules.timeouts",
  response: "player.modules.response",
  tournaments: "player.modules.tournaments",
  history: "player.modules.history",
  highlights: "player.modules.highlights",
};

/** Bulma column width within a tab: "full" | "half" */
export const MODULE_WIDTH = {
  ratings: "full",
  opps: "full",
  counts: "full",
  activity: "half",
  timeouts: "half",
  response: "full",
  stars: "half",
  designed: "half",
  coded: "half",
  highlights: "half",
  history: "full",
  tournaments: "full",
};

export function getPlayerHIndex(summary, userId) {
  if (!summary?.players?.h || userId == null) return null;
  return summary.players.h.find((r) => r.user === userId) ?? null;
}

export function getTopRatings(summary, userId, limit = 3) {
  if (!summary?.ratings?.highest || userId == null) return [];
  return summary.ratings.highest
    .filter((r) => r.user === userId)
    .map(({ rating: elo, game, glicko }) => ({
      elo,
      game,
      glicko,
      glickoLow: glickoRatingLow(glicko),
    }))
    .sort((a, b) => -compareByGlickoLow(a.glicko, b.glicko))
    .slice(0, limit);
}

/**
 * Weekly games-played histogram for a player (`histograms.players` in summary).
 *
 * Bucket semantics (see backend `summarize.ts`): index 0 is the oldest week
 * since the site's first completed game; each index is one 7-day bucket;
 * higher indices are more recent. Player arrays run through that player's last
 * active bucket (length may be shorter than `histograms.all` if they stopped
 * playing earlier). Oldest week is left, most recent is right.
 */
export function getActivityHistogram(summary, userId) {
  if (!summary?.histograms?.players || userId == null) return [];
  const rec = summary.histograms.players.find((r) => r.user === userId);
  return rec?.value ? [...rec.value] : [];
}

/** Last `count` weekly buckets, chronological (oldest left, newest right). */
export function getRecentActivitySparklineWeeks(histogram, count = 12) {
  if (!Array.isArray(histogram) || histogram.length === 0) return [];
  return histogram.slice(-Math.min(count, histogram.length));
}

/** Local ymax for sparkline bars (recent window only). */
export function getRecentActivitySparklineMax(recentWeeks) {
  if (!Array.isArray(recentWeeks) || recentWeeks.length === 0) return 1;
  return Math.max(1, ...recentWeeks);
}

/** Weeks shown on player profile activity/timeout charts. */
export const PAST_YEAR_WEEKS = 52;

/** Fixed x-axis range for past-year charts (week 0 … week 52). */
export const PAST_YEAR_AXIS_MAX = 52;

/** Site-wide week count from summary (`histograms.all`). */
export function getSiteWeekCount(summary) {
  const len = summary?.histograms?.all?.length;
  return len > 0 ? len : null;
}

/**
 * Pad a per-player histogram to the site week timeline (index = site week).
 * Trailing site weeks without player data become zero.
 */
export function alignHistogramToSiteWeeks(histogram, siteWeekCount) {
  if (!Array.isArray(histogram) || histogram.length === 0) {
    return siteWeekCount > 0 ? Array(siteWeekCount).fill(0) : [];
  }
  if (siteWeekCount == null || siteWeekCount <= 0) {
    return [...histogram];
  }
  if (histogram.length >= siteWeekCount) {
    return histogram.slice(0, siteWeekCount);
  }
  return [
    ...histogram,
    ...Array(siteWeekCount - histogram.length).fill(0),
  ];
}

/**
 * Last `weeks` site buckets for chart display. When `siteWeekCount` is given,
 * activity and timeout charts share the same calendar window (recent on the
 * right). Shorter site histories are zero-padded at the start.
 */
export function getPastYearHistogramWindow(
  histogram,
  weeks = PAST_YEAR_WEEKS,
  siteWeekCount = null
) {
  const aligned =
    siteWeekCount != null
      ? alignHistogramToSiteWeeks(histogram, siteWeekCount)
      : histogram;
  if (!Array.isArray(aligned) || aligned.length === 0) {
    return Array(weeks).fill(0);
  }
  if (aligned.length >= weeks) {
    return aligned.slice(-weeks);
  }
  return [...Array(weeks - aligned.length).fill(0), ...aligned];
}

/** Bar chart series for the past-year window (x = 0 … weeks − 1). */
export function getPastYearBarChartData(
  histogram,
  { weeks = PAST_YEAR_WEEKS, siteWeekCount = null } = {}
) {
  const y = getPastYearHistogramWindow(histogram, weeks, siteWeekCount);
  return {
    x: y.map((_, week) => week),
    y,
  };
}

/** Bar chart series for a weekly activity histogram (full history). */
export function getActivityBarChartData(histogram) {
  if (!Array.isArray(histogram) || histogram.length === 0) {
    return { x: [], y: [] };
  }
  return {
    x: histogram.map((_, week) => week),
    y: [...histogram],
  };
}

export function getMedianResponseHours(responses) {
  if (!Array.isArray(responses) || responses.length === 0) return null;
  const hours = responses
    .map((n) => n / (1000 * 60 * 60))
    .sort((a, b) => a - b);
  return hours[Math.floor(hours.length / 2)];
}

/**
 * Static visibility for tab/module pre-filtering. Async modules (highlights)
 * return false here and rely on returning null after load.
 */
export function isModuleVisible(code, ctx) {
  const { user, summary, allRecs, tourneys, responses, isCoder, isDesigner } =
    ctx;

  switch (code) {
    case "stars":
      return Array.isArray(user?.stars) && user.stars.length > 0;
    case "coded":
      return isCoder;
    case "designed":
      return isDesigner;
    case "ratings":
      return (
        summary?.ratings?.highest?.some((r) => r.user === user?.id) ?? false
      );
    case "counts":
      return (
        (Array.isArray(allRecs) && allRecs.length > 0) ||
        getPlayerHIndex(summary, user?.id) !== null
      );
    case "opps":
      return Array.isArray(allRecs) && allRecs.length > 0;
    case "activity": {
      const hist = getActivityHistogram(summary, user?.id);
      return hist.length > 0 && hist.some((v) => v > 0);
    }
    case "timeouts": {
      const timeoutStats = getPlayerTimeoutStats(summary, user?.id);
      return (
        summary?.histograms?.playerTimeouts?.some(
          (r) => r.user === user?.id && r.value?.length > 0
        ) ||
        (timeoutStats?.count ?? 0) > 0 ||
        false
      );
    }
    case "response":
      return Array.isArray(responses) && responses.length > 0;
    case "tournaments":
      return Array.isArray(tourneys) && tourneys.length > 0;
    case "history":
      return Array.isArray(allRecs) && allRecs.length > 0;
    case "highlights":
      return false;
    default:
      return false;
  }
}

export function tabHasVisibleModules(tabId, ctx) {
  const tab = PROFILE_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  if (tabId === "games") {
    return tab.modules.some(
      (code) => code === "highlights" || isModuleVisible(code, ctx)
    );
  }
  return tab.modules.some((code) => isModuleVisible(code, ctx));
}

export function sortModulesForTab(modules, pinnedCode) {
  if (!pinnedCode || !modules.includes(pinnedCode)) return modules;
  return [pinnedCode, ...modules.filter((c) => c !== pinnedCode)];
}
