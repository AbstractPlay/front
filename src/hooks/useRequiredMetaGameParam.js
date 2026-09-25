import { useMemo } from "react";
import { resolveRequiredMetaGameParam } from "../lib/metaGameRoute";

/**
 * Memoized route resolution for required `:metaGame` segments.
 * `resolveRequiredMetaGameParam` allocates a new object every call — do not
 * pass it (or an inline call) into useEffect/useCallback dependency arrays.
 *
 * @param {string | undefined} raw
 * @param {{ skip?: boolean }} [options] When true, returns null (e.g. site-wide hub routes).
 */
export function useRequiredMetaGameParam(raw, { skip = false } = {}) {
  return useMemo(() => {
    if (skip) {
      return null;
    }
    return resolveRequiredMetaGameParam(raw);
  }, [skip, raw]);
}
