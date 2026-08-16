import { viewConfigs } from "../components/Explore/exploreViewConfigs";

export const DEFAULT_EXPLORE_VIEW = "all";

/** Stable display order for the explore view selector. */
export const EXPLORE_VIEW_ORDER = [
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

export const EXPLORE_VIEW_IDS = EXPLORE_VIEW_ORDER.filter(
  (id) => id in viewConfigs
);

export function isValidExploreView(mode) {
  return EXPLORE_VIEW_IDS.includes(mode);
}

export function getExploreViewConfig(mode) {
  return viewConfigs[mode];
}
