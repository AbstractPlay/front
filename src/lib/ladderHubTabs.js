export const DEFAULT_LADDER_HUB_TAB = "leaderboard";

export const LADDER_HUB_TABS = [
  { id: "leaderboard", nameKey: "Ladder.tabs.leaderboard" },
  { id: "activity", nameKey: "Ladder.tabs.activity" },
  { id: "chat", nameKey: "Ladder.tabs.chat" },
];

export const LADDER_HUB_TAB_IDS = LADDER_HUB_TABS.map((tab) => tab.id);

export function isValidLadderHubTab(tab) {
  return LADDER_HUB_TAB_IDS.includes(tab);
}

/** Tab id from URL hash when present and valid; otherwise default leaderboard. */
export function ladderHubTabFromHash(hash) {
  if (!hash || hash === "#") {
    return DEFAULT_LADDER_HUB_TAB;
  }
  const tab = hash.startsWith("#") ? hash.slice(1) : hash;
  if (tab === "" || tab === DEFAULT_LADDER_HUB_TAB) {
    return DEFAULT_LADDER_HUB_TAB;
  }
  return isValidLadderHubTab(tab) ? tab : DEFAULT_LADDER_HUB_TAB;
}

export function ladderHubTabHash(tabId) {
  if (tabId === DEFAULT_LADDER_HUB_TAB) {
    return "";
  }
  return tabId;
}

export function ladderHubTabHref(ladderId, tabId) {
  const hash = ladderHubTabHash(tabId);
  return hash ? `/ladder/${ladderId}#${hash}` : `/ladder/${ladderId}`;
}