import {
  isConcreteMetaGame,
  tournamentDetailPathActive,
  tournamentDetailPathArchived,
} from "./tournamentRoutes.js";

/** Production play site origin; matches {@link scripts/sitemapLinks.mjs} SITEMAP_HOSTNAME. */
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

/** @deprecated Use {@link tournamentDetailPathActive} or {@link tournamentDetailPathArchived}. */
export function tournamentDetailPath(tournamentid, metaGame) {
  if (isConcreteMetaGame(metaGame)) {
    return tournamentDetailPathArchived(tournamentid, metaGame);
  }
  return tournamentDetailPathActive(tournamentid);
}

/**
 * @param {string} pathname
 * @param {string} search
 * @param {string} tournamentid
 * @param {string} [routeMetaGame] — from `/tournament/:metaGame/:tournamentid`
 */
export function shouldNormalizeTournamentDetailUrl(
  pathname,
  search,
  tournamentid,
  routeMetaGame
) {
  if (!tournamentid) {
    return false;
  }
  const path = normalizePlayPathname(pathname);
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = raw ? new URLSearchParams(raw) : new URLSearchParams();

  const queryMeta = params.get("metaGame");
  if (params.has("gameId") && isConcreteMetaGame(queryMeta)) {
    const target = tournamentDetailPathArchived(tournamentid, queryMeta);
    return path !== target;
  }

  if (isConcreteMetaGame(routeMetaGame)) {
    const archivedPath = tournamentDetailPathArchived(
      tournamentid,
      routeMetaGame
    );
    if (path === archivedPath) {
      return params.has("gameId");
    }
  }

  const activePath = tournamentDetailPathActive(tournamentid);
  if (path === activePath && !raw) {
    return false;
  }
  if (path === activePath && raw) {
    return true;
  }

  return false;
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
