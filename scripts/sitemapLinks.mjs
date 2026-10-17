/**
 * Canonical indexable paths for sitemap.xml.
 * Keep explore/stats tab ids in sync with src/lib/exploreSections.js and statsSections.js.
 */

/** @see src/lib/exploreSections.js EXPLORE_VIEW_ORDER */
export const SITEMAP_EXPLORE_VIEW_IDS = [
  "all",
  "newest",
  "hotRaw",
  "hotPlayers",
  "playerSum",
  "hindex",
  "stars",
  "completed",
  "completedRecent",
  "random",
];

/** @see src/lib/statsSections.js STATS_TAB_IDS */
export const SITEMAP_STATS_TAB_IDS = [
  "ratings",
  "games",
  "players",
  "tournaments",
  "site",
];

/** @see src/lib/tournamentSections.js TOURNAMENT_TAB_IDS */
export const SITEMAP_TOURNAMENT_TAB_IDS = ["open", "current", "completed"];

export const SITEMAP_HOSTNAME = "https://play.abstractplay.com";

/**
 * @param {string[]} metas Canonical meta-game uids from the public catalog.
 * @returns {{ url: string, changefreq: string, priority: number }[]}
 */
export function buildSitemapLinks(metas) {
  const links = [
    { url: "/", changefreq: "weekly", priority: 1 },
    { url: "/about", changefreq: "weekly", priority: 0.5 },
    { url: "/legal", changefreq: "yearly", priority: 0.8 },
    { url: "/news", changefreq: "weekly", priority: 0.9 },
    { url: "/challenges", changefreq: "weekly", priority: 0.5 },
    { url: "/recent-games", changefreq: "weekly", priority: 0.3 },
    { url: "/events", changefreq: "weekly", priority: 0.5 },
    { url: "/players", changefreq: "weekly", priority: 0.3 },
  ];

  for (const mode of SITEMAP_EXPLORE_VIEW_IDS) {
    links.push({
      url: `/explore/${mode}`,
      changefreq: "weekly",
      priority: mode === "all" ? 1 : 0.8,
    });
  }

  for (const tab of SITEMAP_STATS_TAB_IDS) {
    links.push({ url: `/stats/${tab}`, changefreq: "weekly", priority: 0.3 });
  }

  for (const tab of SITEMAP_TOURNAMENT_TAB_IDS) {
    links.push({
      url: `/tournaments/${tab}`,
      changefreq: "weekly",
      priority: 0.8,
    });
  }

  for (const meta of metas) {
    links.push({ url: `/games/${meta}`, changefreq: "weekly", priority: 0.75 });
    links.push({
      url: `/challenges/${meta}`,
      changefreq: "weekly",
      priority: 0.5,
    });
    links.push({
      url: `/listgames/current/${meta}`,
      changefreq: "weekly",
      priority: 0.3,
    });
    links.push({
      url: `/listgames/completed/${meta}`,
      changefreq: "weekly",
      priority: 0.3,
    });
    links.push({ url: `/ratings/${meta}`, changefreq: "weekly", priority: 0.3 });
    links.push({
      url: `/recent-games/${meta}`,
      changefreq: "weekly",
      priority: 0.3,
    });
    for (const tab of SITEMAP_TOURNAMENT_TAB_IDS) {
      links.push({
        url: `/tournaments/${tab}/${meta}`,
        changefreq: "weekly",
        priority: 0.5,
      });
    }
  }

  return links;
}

/** Paths that must not appear in the sitemap (noindex / unbounded dynamic). */
export const SITEMAP_EXCLUDED_PATH_PREFIXES = ["/feedback", "/wishlist"];
