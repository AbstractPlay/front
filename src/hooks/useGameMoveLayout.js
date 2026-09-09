import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { resolveGameMoveLayout } from "../lib/GameMove/layoutPreference";

export function useGameMoveLayout() {
  const { search } = useLocation();

  const resolved = useMemo(() => resolveGameMoveLayout(search), [search]);

  return {
    layoutId: resolved.layoutId,
    resolvedFrom: resolved.resolvedFrom,
  };
}
