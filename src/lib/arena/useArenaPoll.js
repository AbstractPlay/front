import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Poll a loader on an interval; slows when document is hidden.
 */
export function useArenaPoll(loadFn, deps = [], { activeMs = 8000, idleMs = 20000 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(loadFn);
  loadRef.current = loadFn;

  const reload = useCallback(async () => {
    try {
      const next = await loadRef.current();
      setData(next);
      setError("");
      return next;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies stable deps
  }, deps);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const tick = async () => {
      if (cancelled) {
        return;
      }
      await reload();
      if (cancelled) {
        return;
      }
      const delay =
        document.visibilityState === "visible" ? activeMs : idleMs;
      timer = window.setTimeout(tick, delay);
    };

    setLoading(true);
    tick();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reload, activeMs, idleMs]);

  return { data, error, loading, reload };
}
