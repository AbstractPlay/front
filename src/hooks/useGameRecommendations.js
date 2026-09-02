import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { buildGameRecommendations } from "../lib/gameRecommendations";
import { buildPlayerRecommendationProfile } from "../lib/playerRecommendationProfile";
import {
  trackRecommendationClick,
  trackRecommendationShow,
} from "../lib/recommendationTracking";
import { isLabSupportedGame } from "../lib/Lab/buildGame";
import { isPublicCatalogGame, getGameDisplayName } from "../lib/gameOptions";
import { useStore } from "../stores";
import {
  fetchPlayerQuickPickData,
  getCachedPlayerQuickPickData,
} from "./usePlayerQuickPicks";

const MVTIMES_URL = "https://records.abstractplay.com/mvtimes.json";
const COOCCUR_URL =
  "https://records.abstractplay.com/recommendations/cooccur.json";

/** @type {object | null | undefined} */
let mvtimesSessionCache = undefined;
/** @type {Promise<object | null> | null} */
let mvtimesInflight = null;
/** @type {object | null | undefined} */
let cooccurSessionCache = undefined;
/** @type {Promise<object | null> | null} */
let cooccurInflight = null;

async function fetchMvtimes() {
  if (mvtimesSessionCache !== undefined) {
    return mvtimesSessionCache;
  }
  if (mvtimesInflight) {
    return mvtimesInflight;
  }
  mvtimesInflight = fetch(MVTIMES_URL)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      mvtimesSessionCache = data;
      mvtimesInflight = null;
      return data;
    })
    .catch((err) => {
      mvtimesInflight = null;
      throw err;
    });
  return mvtimesInflight;
}

async function fetchCooccur() {
  if (cooccurSessionCache !== undefined) {
    return cooccurSessionCache;
  }
  if (cooccurInflight) {
    return cooccurInflight;
  }
  cooccurInflight = fetch(COOCCUR_URL)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      cooccurSessionCache = data;
      cooccurInflight = null;
      return data;
    })
    .catch(() => {
      cooccurSessionCache = null;
      cooccurInflight = null;
      return null;
    });
  return cooccurInflight;
}

function buildLabCatalog() {
  return [...gameinfo.values()]
    .filter((info) => isPublicCatalogGame(info) && isLabSupportedGame(info.uid))
    .map((info) => ({
      id: info.uid,
      name: getGameDisplayName(info.uid),
      categories: info.categories ?? [],
      dateAdded: info.dateAdded,
    }));
}

/**
 * Personalized game recommendations for the game picker and explore surfaces.
 * @param {{
 *   enabled?: boolean,
 *   labOnly?: boolean,
 *   excludeIds?: string[],
 *   surface?: "gamePicker" | "explore" | "dashboard",
 *   trackShows?: boolean,
 * }} options
 */
export function useGameRecommendations({
  enabled = true,
  labOnly = false,
  excludeIds = [],
  surface = "gamePicker",
  trackShows = false,
} = {}) {
  const globalMe = useStore((state) => state.globalMe);
  const userId = globalMe?.id ?? null;
  const starredIds = useMemo(
    () =>
      Array.isArray(globalMe?.stars) ? globalMe.stars.filter(Boolean) : [],
    [globalMe?.stars]
  );
  const [playerRemote, setPlayerRemote] = useState({
    allRecs: null,
    summary: null,
    loading: false,
    error: null,
  });
  const [mvtimes, setMvtimes] = useState(
    /** @type {object | null | undefined} */ (undefined)
  );
  const [mvtimesError, setMvtimesError] = useState(null);
  const [cooccur, setCooccur] = useState(
    /** @type {object | null | undefined} */ (undefined)
  );

  useEffect(() => {
    if (!enabled) {
      setPlayerRemote({
        allRecs: null,
        summary: null,
        loading: false,
        error: null,
      });
      return;
    }
    if (!userId) {
      setPlayerRemote({
        allRecs: [],
        summary: null,
        loading: false,
        error: null,
      });
      return;
    }
    const cached = getCachedPlayerQuickPickData(userId);
    if (cached) {
      setPlayerRemote({
        allRecs: cached.allRecs,
        summary: cached.summary,
        loading: false,
        error: null,
      });
      return;
    }
    let cancelled = false;
    setPlayerRemote((prev) => ({ ...prev, loading: true, error: null }));
    fetchPlayerQuickPickData(userId)
      .then(({ allRecs, summary }) => {
        if (cancelled) return;
        setPlayerRemote({ allRecs, summary, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setPlayerRemote({
          allRecs: [],
          summary: null,
          loading: false,
          error: err?.message ?? String(err),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) {
      setMvtimes(undefined);
      setMvtimesError(null);
      return;
    }
    if (mvtimesSessionCache !== undefined) {
      setMvtimes(mvtimesSessionCache);
      return;
    }
    let cancelled = false;
    fetchMvtimes()
      .then((data) => {
        if (cancelled) return;
        setMvtimes(data);
        setMvtimesError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setMvtimes(null);
        setMvtimesError(err?.message ?? String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCooccur(undefined);
      return;
    }
    if (cooccurSessionCache !== undefined) {
      setCooccur(cooccurSessionCache);
      return;
    }
    let cancelled = false;
    fetchCooccur().then((data) => {
      if (cancelled) return;
      setCooccur(data);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const profile = useMemo(
    () =>
      buildPlayerRecommendationProfile({
        starredIds,
        allRecs: playerRemote.allRecs,
        summary: playerRemote.summary,
        userId,
      }),
    [starredIds, playerRemote.allRecs, playerRemote.summary, userId]
  );

  const catalog = useMemo(
    () => (labOnly ? buildLabCatalog() : null),
    [labOnly]
  );

  const excludeKey = useMemo(
    () => [...new Set(excludeIds.filter(Boolean))].sort().join(","),
    [excludeIds]
  );

  const recommendations = useMemo(() => {
    if (!enabled || mvtimes === undefined) {
      return [];
    }
    return buildGameRecommendations({
      profile,
      cooccurData: cooccur ?? null,
      popularityData: mvtimes,
      excludeIds: excludeKey ? excludeKey.split(",") : [],
      catalog,
    });
  }, [enabled, mvtimes, cooccur, profile, excludeKey, catalog]);

  const batchInputKey = useMemo(
    () =>
      [
        userId ?? "anon",
        profile.tier,
        excludeKey,
        labOnly ? "lab" : "all",
        recommendations.map((rec) => rec.id).join(","),
      ].join("|"),
    [userId, profile.tier, excludeKey, labOnly, recommendations]
  );

  const batchIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `rec-${Date.now()}`
  );
  const lastBatchInputKey = useRef(batchInputKey);
  if (lastBatchInputKey.current !== batchInputKey) {
    lastBatchInputKey.current = batchInputKey;
    batchIdRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `rec-${Date.now()}`;
  }

  const loading =
    enabled &&
    (mvtimes === undefined || (Boolean(userId) && playerRemote.loading));

  const shownBatchIdsRef = useRef(new Set());

  useEffect(() => {
    if (!trackShows || !userId || loading || recommendations.length === 0) {
      return;
    }
    const batchId = batchIdRef.current;
    if (shownBatchIdsRef.current.has(batchId)) {
      return;
    }
    shownBatchIdsRef.current.add(batchId);
    trackRecommendationShow({
      batchId,
      surface,
      tier: profile.tier,
      recommendations,
    });
  }, [
    trackShows,
    userId,
    loading,
    recommendations,
    surface,
    profile.tier,
    batchInputKey,
  ]);

  const trackClick = useCallback(
    (metaGame, position, reasonType) => {
      if (!userId) return;
      trackRecommendationClick({
        batchId: batchIdRef.current,
        surface,
        tier: profile.tier,
        metaGame,
        position,
        reasonType,
      });
    },
    [userId, surface, profile.tier]
  );

  return {
    recommendations,
    tier: profile.tier,
    loading,
    error: playerRemote.error ?? mvtimesError,
    batchId: batchIdRef.current,
    isLoggedIn: Boolean(userId),
    trackClick,
  };
}

/** @visibleForTesting */
export function clearGameRecommendationsCache() {
  mvtimesSessionCache = undefined;
  mvtimesInflight = null;
  cooccurSessionCache = undefined;
  cooccurInflight = null;
}

/** @visibleForTesting */
export { fetchCooccur, fetchMvtimes };
