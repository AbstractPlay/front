import { useCallback } from "react";
import { expandVariants } from "../lib/expandVariants";

export function useExpandVariants(metaGame) {
  const expandVariantsFn = useCallback(
    (vars) => expandVariants(metaGame, vars ?? []),
    [metaGame]
  );

  return { expandVariants: expandVariantsFn };
}
