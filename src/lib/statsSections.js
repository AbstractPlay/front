import HighestSingleRating from "../components/Stats/HighestSingleRating";
import AvgRatings from "../components/Stats/AvgRatings";
import TopPlayers from "../components/Stats/TopPlayers";
import NumPlays from "../components/Stats/NumPlays";
import PlayerStats from "../components/Stats/PlayerStats";
import RivalryStats from "../components/Stats/RivalryStats";
import GameStats from "../components/Stats/GameStats";
import PieStats from "../components/Stats/PieStats";
import SiteStats from "../components/Stats/SiteStats";
import Tournaments from "../components/Stats/Tournaments";

export const DEFAULT_STATS_TAB = "site";

export const STATS_TABS = [
  {
    id: "ratings",
    nameKey: "stats.tabs.ratings",
    modules: ["highestSingle", "avgRatings", "topPlayers"],
  },
  {
    id: "games",
    nameKey: "stats.tabs.games",
    modules: ["numPlays", "gameStats", "pieStats"],
  },
  {
    id: "players",
    nameKey: "stats.tabs.players",
    modules: ["playerStats", "rivalryStats"],
  },
  {
    id: "tournaments",
    nameKey: "stats.tabs.tournaments",
    modules: ["tourneyStats"],
  },
  {
    id: "site",
    nameKey: "stats.tabs.site",
    modules: ["siteStats"],
  },
];

export const STATS_TAB_IDS = STATS_TABS.map((tab) => tab.id);

export const STATS_MODULES = {
  highestSingle: {
    component: HighestSingleRating,
    nameKey: "stats_module_highestSingle",
    explanationKey: "stats.explanations.highestSingle",
    width: "full",
  },
  avgRatings: {
    component: AvgRatings,
    nameKey: "stats_module_avgRatings",
    explanationKey: "stats.explanations.avgRatings",
    width: "full",
  },
  topPlayers: {
    component: TopPlayers,
    nameKey: "stats_module_topPlayers",
    explanationKey: "stats.explanations.topPlayers",
    width: "full",
  },
  numPlays: {
    component: NumPlays,
    nameKey: "stats_module_numPlays",
    explanationKey: "stats.explanations.numPlays",
    width: "full",
  },
  gameStats: {
    component: GameStats,
    nameKey: "stats_module_gameStats",
    explanationKey: "stats.explanations.gameStats",
    width: "full",
  },
  pieStats: {
    component: PieStats,
    nameKey: "stats_module_pieStats",
    explanationKey: "stats.explanations.pieStats",
    width: "full",
  },
  playerStats: {
    component: PlayerStats,
    nameKey: "stats_module_playerStats",
    explanationKey: "stats.explanations.playerStats",
    width: "full",
  },
  rivalryStats: {
    component: RivalryStats,
    nameKey: "stats_module_rivalryStats",
    explanationKey: "stats.explanations.rivalryStats",
    width: "full",
  },
  tourneyStats: {
    component: Tournaments,
    nameKey: "stats_module_tourneyStats",
    explanationKey: "stats.explanations.tourneyStats",
    width: "full",
  },
  siteStats: {
    component: SiteStats,
    nameKey: "stats_module_siteStats",
    explanationKey: "stats.explanations.siteStats",
    width: "full",
  },
};

export function isValidStatsTab(tab) {
  return STATS_TAB_IDS.includes(tab);
}

export function getStatsTab(tabId) {
  return STATS_TABS.find((tab) => tab.id === tabId);
}

export function sortStatsModules(modules, pinnedCode) {
  if (!pinnedCode || !modules.includes(pinnedCode)) {
    return modules;
  }
  return [pinnedCode, ...modules.filter((code) => code !== pinnedCode)];
}
