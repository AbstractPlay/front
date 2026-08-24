import { useEffect } from "react";
import {
  ensureSummaryPlayers,
  ensureSummaryRatings,
  ensureSummarySite,
} from "../lib/summaryFetch";

/**
 * Lazy-load a summary CDN tier into Zustand on mount.
 * @param {"site" | "players" | "ratings" | null|undefined} tier
 */
export function useEnsureSummaryTier(tier) {
  useEffect(() => {
    if (!tier) {
      return;
    }
    if (tier === "site") {
      ensureSummarySite();
    } else if (tier === "players") {
      ensureSummaryPlayers();
    } else if (tier === "ratings") {
      ensureSummaryRatings();
    }
  }, [tier]);
}
