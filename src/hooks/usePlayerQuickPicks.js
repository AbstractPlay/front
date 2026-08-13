import { useEffect, useMemo, useState } from "react";
import { useStore } from "../stores";
import { isLabSupportedGame } from "../lib/Lab/buildGame";
import { buildPlayerQuickPickSections } from "../lib/playerGameQuickPicks";

const PLAYER_RECORDS_URL = "https://records.abstractplay.com/player";
const SUMMARY_URL = "https://records.abstractplay.com/_summary.json";

/** @type {Map<string, { allRecs: unknown[], summary: object|null }>} */
const sessionCache = new Map();

/** @type {Map<string, Promise<{ allRecs: unknown[], summary: object|null }>>} */
const inflight = new Map();

async function fetchPlayerQuickPickData(userId) {
  if (sessionCache.has(userId)) {
    return sessionCache.get(userId);
  }
  if (inflight.has(userId)) {
    return inflight.get(userId);
  }
  const promise = (async () => {
    const [recsRes, summaryRes] = await Promise.all([
      fetch(`${PLAYER_RECORDS_URL}/${userId}.json`),
      fetch(SUMMARY_URL),
    ]);
    const allRecs = recsRes.ok ? await recsRes.json() : [];
    const summary = summaryRes.ok ? await summaryRes.json() : null;
    const payload = {
      allRecs: Array.isArray(allRecs) ? allRecs : [],
      summary,
    };
    sessionCache.set(userId, payload);
    inflight.delete(userId);
    return payload;
  })().catch((err) => {
    inflight.delete(userId);
    throw err;
  });
  inflight.set(userId, promise);
  return promise;
}

/**
 * Profile-driven quick picks for the game picker modal.
 * @param {{ enabled?: boolean, labOnly?: boolean }} options
 */
export function usePlayerQuickPicks({ enabled = true, labOnly = false } = {}) {
  const globalMe = useStore((state) => state.globalMe);
  const userId = globalMe?.id ?? null;
  const starredIds = useMemo(
    () =>
      Array.isArray(globalMe?.stars) ? globalMe.stars.filter(Boolean) : [],
    [globalMe?.stars]
  );
  const [remote, setRemote] = useState({
    allRecs: null,
    summary: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !userId) {
      setRemote({ allRecs: null, summary: null, loading: false, error: null });
      return;
    }
    const cached = sessionCache.get(userId);
    if (cached) {
      setRemote({
        allRecs: cached.allRecs,
        summary: cached.summary,
        loading: false,
        error: null,
      });
      return;
    }
    let cancelled = false;
    setRemote((prev) => ({ ...prev, loading: true, error: null }));
    fetchPlayerQuickPickData(userId)
      .then(({ allRecs, summary }) => {
        if (cancelled) return;
        setRemote({ allRecs, summary, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setRemote({
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

  const sections = useMemo(
    () =>
      buildPlayerQuickPickSections({
        starredIds,
        allRecs: remote.allRecs,
        summary: remote.summary,
        userId,
        labOnly,
        isLabSupported: isLabSupportedGame,
      }),
    [starredIds, remote.allRecs, remote.summary, userId, labOnly]
  );

  return {
    sections,
    starredIds,
    loading: remote.loading,
    error: remote.error,
    isLoggedIn: Boolean(userId),
  };
}

/** @visibleForTesting */
export function clearPlayerQuickPicksCache() {
  sessionCache.clear();
  inflight.clear();
}
