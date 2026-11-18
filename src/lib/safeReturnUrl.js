const UNSAFE_PREFIX_RE = /^\/[\\/]/;

/**
 * Allow only same-origin relative paths for post-login redirects.
 *
 * @param {unknown} raw
 * @param {string} [fallback='/']
 * @returns {string}
 */
export function safeReturnUrl(raw, fallback = "/") {
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  if (trimmed === "" || !trimmed.startsWith("/") || UNSAFE_PREFIX_RE.test(trimmed)) {
    return fallback;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes("javascript:") || lower.includes("data:") || lower.includes("vbscript:")) {
    return fallback;
  }
  try {
    const url = new URL(trimmed, "https://play.local");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * @param {unknown} raw
 * @returns {string|null}
 */
export function readReturnUrlFromSearch(rawSearch) {
  if (typeof rawSearch !== "string" || rawSearch.length === 0) {
    return null;
  }
  const params = new URLSearchParams(
    rawSearch.startsWith("?") ? rawSearch : `?${rawSearch}`,
  );
  const value = params.get("returnUrl");
  return value != null && value !== "" ? value : null;
}