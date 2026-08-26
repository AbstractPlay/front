import { gameinfo } from "@abstractplay/gameslib";

export const DEFAULT_TOURNAMENT_TAB = "open";

export const TOURNAMENT_TABS = [
  { id: "open", nameKey: "Tournament.tabs.open" },
  { id: "current", nameKey: "Tournament.tabs.current" },
  { id: "completed", nameKey: "Tournament.tabs.completed" },
];

export const TOURNAMENT_TAB_IDS = TOURNAMENT_TABS.map((tab) => tab.id);

export function isValidTournamentTab(tab) {
  return TOURNAMENT_TAB_IDS.includes(tab);
}

export function getTournamentTab(tabId) {
  return TOURNAMENT_TABS.find((tab) => tab.id === tabId);
}

export function isValidTournamentMetaGame(metaGame) {
  return (
    metaGame !== null &&
    metaGame !== undefined &&
    metaGame !== "" &&
    gameinfo.has(metaGame)
  );
}

/** Build list URL: `/tournaments/:tab` or `/tournaments/:tab/:metaGame`. */
export function tournamentListPath(tab, metaGame = null) {
  const safeTab = isValidTournamentTab(tab) ? tab : DEFAULT_TOURNAMENT_TAB;
  if (isValidTournamentMetaGame(metaGame)) {
    return `/tournaments/${safeTab}/${metaGame}`;
  }
  return `/tournaments/${safeTab}`;
}

/**
 * Resolve `/tournaments/:tab?/:metaGame?`, including legacy `/tournaments/:gameUid`.
 * Returns `{ tab, metaGame, redirectTo }` where `redirectTo` is set when the URL
 * should be normalized (missing tab, invalid tab, or legacy game-only path).
 */
export function resolveTournamentRouteParams(tabParam, metaGameParam, storedTab) {
  const preferredTab = isValidTournamentTab(storedTab)
    ? storedTab
    : DEFAULT_TOURNAMENT_TAB;

  if (tabParam === undefined || tabParam === "") {
    return {
      tab: preferredTab,
      metaGame: isValidTournamentMetaGame(metaGameParam) ? metaGameParam : null,
      redirectTo: tournamentListPath(
        preferredTab,
        isValidTournamentMetaGame(metaGameParam) ? metaGameParam : null
      ),
    };
  }

  if (isValidTournamentTab(tabParam)) {
    const metaGame = isValidTournamentMetaGame(metaGameParam)
      ? metaGameParam
      : null;
    const redirectTo =
      metaGameParam !== undefined &&
      metaGameParam !== "" &&
      metaGame === null
        ? tournamentListPath(tabParam, null)
        : null;
    return { tab: tabParam, metaGame, redirectTo };
  }

  if (isValidTournamentMetaGame(tabParam)) {
    return {
      tab: preferredTab,
      metaGame: tabParam,
      redirectTo: tournamentListPath(preferredTab, tabParam),
    };
  }

  return {
    tab: DEFAULT_TOURNAMENT_TAB,
    metaGame: null,
    redirectTo: tournamentListPath(DEFAULT_TOURNAMENT_TAB, null),
  };
}
