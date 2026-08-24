import { useStore } from "../stores";

export function useSiteSummary() {
  const summary = useStore((s) => s.summary);
  const loadState = useStore((s) => s.summaryLoadState);
  return {
    summary,
    loadState,
    isPending: loadState === "pending" || loadState === "idle",
    isReady: loadState === "ready",
    isError: loadState === "error",
  };
}
