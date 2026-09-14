import { useEffect, useMemo, useState } from "react";
import { useStore } from "../stores";
import { buildOpponentQuickPickSections } from "../lib/playerOpponentQuickPicks";
import { fetchPlayerQuickPickData } from "./usePlayerQuickPicks";

/**
 * History-driven quick picks for the challenge player picker.
 * @param {{ enabled?: boolean }} options
 */
export function useOpponentQuickPicks({ enabled = true } = {}) {
  const globalMe = useStore((state) => state.globalMe);
  const userId = globalMe?.id ?? null;
  const [remote, setRemote] = useState({
    allRecs: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !userId) {
      setRemote({ allRecs: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setRemote((prev) => ({ ...prev, loading: true, error: null }));
    fetchPlayerQuickPickData(userId)
      .then(({ allRecs }) => {
        if (cancelled) return;
        setRemote({
          allRecs: Array.isArray(allRecs) ? allRecs : [],
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setRemote({
          allRecs: [],
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
      buildOpponentQuickPickSections({
        allRecs: remote.allRecs,
        myUserId: userId,
      }),
    [remote.allRecs, userId]
  );

  return {
    sections,
    loading: remote.loading,
    error: remote.error,
    isLoggedIn: Boolean(userId),
  };
}
