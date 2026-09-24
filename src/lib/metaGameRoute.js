import { resolveMetaGameUid } from "./gameOptions";

/**
 * Resolve a required `:metaGame` route segment.
 * @param {string | undefined} raw
 * @returns {{ kind: "ok", resolved: string } | { kind: "invalid" } | { kind: "redirect", resolved: string }}
 */
export function resolveRequiredMetaGameParam(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return { kind: "invalid" };
  }
  const resolved = resolveMetaGameUid(raw);
  if (resolved === undefined) {
    return { kind: "invalid" };
  }
  if (resolved !== raw) {
    return { kind: "redirect", resolved };
  }
  return { kind: "ok", resolved };
}
