import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  inferPlayContextFromPathname,
  resolveGameMoveLayout,
} from "../lib/GameMove/layoutPreference";

export function useGameMoveLayout() {
  const { search, pathname } = useLocation();
  const playContext = inferPlayContextFromPathname(pathname);

  const resolved = useMemo(
    () => resolveGameMoveLayout(search, { playContext }),
    [search, playContext]
  );

  return {
    layoutId: resolved.layoutId,
    resolvedFrom: resolved.resolvedFrom,
    playContext,
  };
}
