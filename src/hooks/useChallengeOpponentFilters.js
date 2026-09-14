import { useMemo } from "react";
import { useStorageState } from "react-use-storage-state";
import { minSeenFromOnlySee } from "../lib/challengeOpponentOptions";

export function useChallengeOpponentFilters() {
  const [onlySee, setOnlySee] = useStorageState(
    "challenges-filter-opponent-activity",
    "all"
  );
  const [matchFilter, setMatchFilter] = useStorageState(
    "challenges-filter-match",
    "all"
  );

  const minSeen = useMemo(() => minSeenFromOnlySee(onlySee), [onlySee]);

  return {
    onlySee,
    setOnlySee,
    matchFilter,
    setMatchFilter,
    minSeen,
  };
}
