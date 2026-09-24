/** Production play site origin; matches {@link bin/sitemapLinks.mjs} SITEMAP_HOSTNAME. */
export const PLAY_SITE_ORIGIN = "https://play.abstractplay.com";

/**
 * Normalize a pathname for canonical URLs: leading slash, no trailing slash except `/`.
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePlayPathname(pathname) {
  if (pathname === undefined || pathname === null || pathname === "") {
    return "/";
  }
  let path = String(pathname);
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
}

/**
 * Absolute canonical URL on play.abstractplay.com (no query string).
 * @param {string} pathname
 * @returns {string}
 */
export function canonicalPlayUrl(pathname) {
  return `${PLAY_SITE_ORIGIN}${normalizePlayPathname(pathname)}`;
}

/** Canonical path for a recurring-tournament detail page (id-only). */
export function tournamentDetailPath(tournamentid) {
  return `/tournament/${tournamentid}`;
}

/** True when pathname + search should redirect to {@link tournamentDetailPath}. */
export function shouldNormalizeTournamentDetailUrl(pathname, search, tournamentid) {
  if (!tournamentid) {
    return false;
  }
  const canonical = tournamentDetailPath(tournamentid);
  return normalizePlayPathname(pathname) !== canonical || Boolean(search);
}

/** Query param names stripped from move URLs when computing canonical (step 3). */
export const MOVE_EXPLORATION_SEARCH_PARAMS = ["move", "nodeid"];

/**
 * Build canonical play URL from pathname + search, dropping exploration params.
 * @param {string} pathname
 * @param {string} [search] — leading `?` optional
 * @returns {string}
 */
export function canonicalPlayUrlFromLocation(pathname, search = "") {
  const path = normalizePlayPathname(pathname);
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) {
    return canonicalPlayUrl(path);
  }
  const params = new URLSearchParams(raw);
  for (const key of MOVE_EXPLORATION_SEARCH_PARAMS) {
    params.delete(key);
  }
  const remainder = params.toString();
  if (!remainder) {
    return canonicalPlayUrl(path);
  }
  return `${PLAY_SITE_ORIGIN}${path}?${remainder}`;
}
