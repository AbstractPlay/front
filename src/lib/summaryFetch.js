import { useStore } from "../stores";

export const RECORDS_BASE_URL = "https://records.abstractplay.com";

export const SUMMARY_URLS = {
  monolith: `${RECORDS_BASE_URL}/_summary.json`,
  site: `${RECORDS_BASE_URL}/_summary-site.json`,
  players: `${RECORDS_BASE_URL}/_summary-players.json`,
  ratings: `${RECORDS_BASE_URL}/_summary-ratings.json`,
  playerSummary: (userId) =>
    `${RECORDS_BASE_URL}/player/${userId}-summary.json`,
};

/** @typedef {"site" | "players" | "ratings"} SummaryTier */

const TIER_LOAD_STATE_KEYS = {
  site: "summarySiteLoadState",
  players: "summaryPlayersLoadState",
  ratings: "summaryRatingsLoadState",
};

/** @type {Map<SummaryTier, Promise<void>>} */
const inflight = new Map();

/**
 * Strip tier wrapper fields (`generated`, `tier`) from a CDN JSON payload.
 * @param {object|null|undefined} data
 */
export function unwrapTierPayload(data) {
  if (!data || typeof data !== "object") {
    return {};
  }
  const { tier: _tier, generated: _generated, ...rest } = data;
  return rest;
}

/**
 * Build a minimal summary object from a per-player slice (quick picks / recommendations).
 * @param {object|null|undefined} slice
 */
export function summaryFromPlayerSlice(slice) {
  if (!slice?.user) {
    return null;
  }
  const userId = slice.user;
  const ratings = slice.ratings ?? {};
  return {
    ratings: {
      highest: ratings.highest ?? [],
      avg: ratings.avg != null ? [{ user: userId, rating: ratings.avg }] : [],
      weighted:
        ratings.weighted != null
          ? [{ user: userId, rating: ratings.weighted }]
          : [],
      glickoByGame: ratings.glickoByGame ?? [],
      glickoSite: ratings.glickoSite != null ? [ratings.glickoSite] : [],
    },
  };
}

/**
 * Per-user timeout aggregates (`timeoutStats`) with legacy `timeouts` event list fallback.
 * @param {object|null|undefined} summary
 * @param {string|null|undefined} userId
 */
export function getPlayerTimeoutStats(summary, userId) {
  if (!summary?.players || userId == null) {
    return null;
  }
  const stats = summary.players.timeoutStats?.find((r) => r.user === userId);
  if (stats) {
    return stats;
  }
  const legacy = summary.players.timeouts?.filter((r) => r.user === userId);
  if (!legacy?.length) {
    return null;
  }
  return {
    user: userId,
    count: legacy.length,
    latestTimeoutMs: Math.max(...legacy.map((r) => r.value)),
  };
}

/**
 * @param {object|null} prev
 * @param {object} sitePayload
 */
export function mergeSiteSummary(prev, sitePayload) {
  return { ...(prev ?? {}), ...sitePayload };
}

/**
 * @param {object|null} prev
 * @param {object} playersPayload
 */
export function mergePlayersSummary(prev, playersPayload) {
  const { players, histograms } = playersPayload;
  return {
    ...(prev ?? {}),
    players,
    histograms: {
      ...(prev?.histograms ?? {}),
      players: histograms?.players,
      playerTimeouts: histograms?.playerTimeouts,
    },
  };
}

/**
 * @param {object|null} prev
 * @param {object} ratingsPayload
 */
export function mergeRatingsSummary(prev, ratingsPayload) {
  return {
    ...(prev ?? {}),
    ratings: ratingsPayload.ratings,
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Summary fetch failed: ${url} (${res.status})`);
  }
  return res.json();
}

/**
 * @param {SummaryTier} tier
 * @param {string} url
 * @param {(prev: object|null, payload: object) => object} merge
 */
async function loadSummaryTier(tier, url, merge) {
  const loadStateKey = TIER_LOAD_STATE_KEYS[tier];
  const store = useStore.getState();
  if (store[loadStateKey] === "ready") {
    return;
  }
  if (inflight.has(tier)) {
    return inflight.get(tier);
  }

  const promise = (async () => {
    useStore.setState({ [loadStateKey]: "pending" });
    try {
      const json = await fetchJson(url);
      const payload = unwrapTierPayload(json);
      useStore.setState((state) => {
        const merged = merge(state.summary, payload);
        const next = {
          summary: merged,
          [loadStateKey]: "ready",
        };
        if (tier === "site") {
          next.summaryLoadState = "ready";
        }
        return next;
      });
    } catch (err) {
      useStore.setState((state) => {
        const next = { [loadStateKey]: "error" };
        if (tier === "site") {
          next.summary = null;
          next.summaryLoadState = "error";
        }
        return next;
      });
      throw err;
    } finally {
      inflight.delete(tier);
    }
  })();

  inflight.set(tier, promise);
  return promise;
}

export function ensureSummarySite() {
  return loadSummaryTier("site", SUMMARY_URLS.site, mergeSiteSummary);
}

export function ensureSummaryPlayers() {
  return loadSummaryTier("players", SUMMARY_URLS.players, mergePlayersSummary);
}

export function ensureSummaryRatings() {
  return loadSummaryTier("ratings", SUMMARY_URLS.ratings, mergeRatingsSummary);
}

/**
 * Fetch per-player summary slice; falls back to ratings tier on 404.
 * @param {string} userId
 */
export async function fetchPlayerSummarySlice(userId) {
  try {
    const res = await fetch(SUMMARY_URLS.playerSummary(userId));
    if (res.ok) {
      return await res.json();
    }
  } catch {
    /* try ratings tier */
  }
  await ensureSummaryRatings();
  return null;
}

/** @visibleForTesting */
export function clearSummaryFetchInflight() {
  inflight.clear();
}
