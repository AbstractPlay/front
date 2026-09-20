/**
 * Extract AP user id from a markdown href pointing at a player profile.
 * Supports `/player/:id` and absolute play.abstractplay.com URLs.
 */
export function playerIdFromProfileHref(href) {
  if (!href || typeof href !== "string") {
    return null;
  }
  if (href.startsWith("/")) {
    const relative = href.match(/^\/player\/([^/?#]+)/i);
    return relative?.[1] ?? null;
  }
  const absolute = href.match(/^https?:\/\/(?:[^/]*\.)?abstractplay\.com\/player\/([^/?#]+)/i);
  return absolute?.[1] ?? null;
}
