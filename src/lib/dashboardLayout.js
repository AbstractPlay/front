export const DASHBOARD_LAYOUT_VERTICAL = "vertical";
export const DASHBOARD_LAYOUT_TABBED = "tabbed";

export const DASHBOARD_TAB_GAMES = "games";
export const DASHBOARD_TAB_TOURNAMENTS = "tournaments";
export const DASHBOARD_TAB_LADDERS = "ladders";
export const DASHBOARD_TAB_CHALLENGES = "challenges";
export const DASHBOARD_TAB_ADMIN = "admin";

const DASHBOARD_TABS = [
  DASHBOARD_TAB_GAMES,
  DASHBOARD_TAB_TOURNAMENTS,
  DASHBOARD_TAB_LADDERS,
  DASHBOARD_TAB_CHALLENGES,
  DASHBOARD_TAB_ADMIN,
];

export function isDashboardLayoutMode(mode) {
  return mode === DASHBOARD_LAYOUT_VERTICAL || mode === DASHBOARD_LAYOUT_TABBED;
}

export function isDashboardTab(tab) {
  return DASHBOARD_TABS.includes(tab);
}

/**
 * Which dashboard tabs have content (empty tournaments tab is hidden in tabbed
 * mode; other empty tabs are disabled).
 */
export function dashboardTabAvailability({
  myMove,
  waiting,
  watchedGames,
  currentTournaments,
  ladderMemberships,
  challengesReceived,
  challengesAwaitingResponse,
  openStandingChallenges,
  realStanding,
  isAdmin,
}) {
  // Games tab always available in tabbed mode (move tables are always shown).
  const games = true;
  const tournaments = (currentTournaments?.length ?? 0) > 0;
  const ladders = (ladderMemberships?.length ?? 0) > 0;
  const challenges =
    (challengesReceived?.length ?? 0) > 0 ||
    challengesAwaitingResponse ||
    (openStandingChallenges?.length ?? 0) > 0 ||
    (realStanding?.length ?? 0) > 0;
  return {
    [DASHBOARD_TAB_GAMES]: games,
    [DASHBOARD_TAB_TOURNAMENTS]: tournaments,
    [DASHBOARD_TAB_LADDERS]: ladders,
    [DASHBOARD_TAB_CHALLENGES]: challenges,
    [DASHBOARD_TAB_ADMIN]: isAdmin === true,
  };
}

/** Default section when opening tabbed layout (Games is always first). */
export function defaultTabbedDashboardTab(availability) {
  if (availability[DASHBOARD_TAB_GAMES]) {
    return DASHBOARD_TAB_GAMES;
  }
  return firstEnabledDashboardTab(availability);
}

/** @param {Record<string, boolean>} availability */
export function firstEnabledDashboardTab(availability) {
  for (const tab of DASHBOARD_TABS) {
    if (availability[tab]) {
      return tab;
    }
  }
  return DASHBOARD_TAB_GAMES;
}

/** @param {string} tab @param {Record<string, boolean>} availability */
export function normalizeDashboardTab(tab, availability) {
  if (isDashboardTab(tab) && availability[tab]) {
    return tab;
  }
  return firstEnabledDashboardTab(availability);
}
