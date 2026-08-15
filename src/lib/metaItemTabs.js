export const DEFAULT_META_TAB = "summary";

export const META_TABS = [
  { id: "summary", nameKey: "meta.tabs.summary" },
  { id: "challenges", nameKey: "meta.tabs.challenges" },
  { id: "games", nameKey: "meta.tabs.currentGames" },
  { id: "completed", nameKey: "meta.tabs.completedGames" },
  { id: "players", nameKey: "meta.tabs.players" },
  { id: "tournaments", nameKey: "meta.tabs.tournaments" },
  { id: "history", nameKey: "meta.tabs.historicalData" },
];

export const META_TAB_IDS = META_TABS.map((tab) => tab.id);

export function isValidMetaTab(tab) {
  return META_TAB_IDS.includes(tab);
}

export function metaTabFromHash(hash) {
  const tab = hash.startsWith("#") ? hash.slice(1) : hash;
  if (tab === "" || tab === DEFAULT_META_TAB) {
    return DEFAULT_META_TAB;
  }
  return isValidMetaTab(tab) ? tab : DEFAULT_META_TAB;
}

export function metaTabHash(tabId) {
  if (tabId === DEFAULT_META_TAB) {
    return "";
  }
  return tabId;
}
