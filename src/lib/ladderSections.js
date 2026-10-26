import { gameinfo } from "@abstractplay/gameslib";

export const DEFAULT_LADDER_TAB = "all";

export const LADDER_TABS = [{ id: "all", nameKey: "Ladder.tabs.all" }];

export const LADDER_TAB_IDS = LADDER_TABS.map((tab) => tab.id);

export function isValidLadderTab(tab) {
  return LADDER_TAB_IDS.includes(tab);
}

export function isValidLadderMetaGame(metaGame) {
  return (
    metaGame !== null &&
    metaGame !== undefined &&
    metaGame !== "" &&
    gameinfo.has(metaGame)
  );
}

/** Build list URL: `/ladders/:tab` or `/ladders/:tab/:metaGame`. */
export function ladderListPathForTab(tab, metaGame = null) {
  const safeTab = isValidLadderTab(tab) ? tab : DEFAULT_LADDER_TAB;
  if (isValidLadderMetaGame(metaGame)) {
    return `/ladders/${safeTab}/${metaGame}`;
  }
  return `/ladders/${safeTab}`;
}

/**
 * Resolve `/ladders/:tab?/:metaGame?`, including legacy `/ladders/:gameUid`.
 */
export function resolveLadderRouteParams(tabParam, metaGameParam, storedTab) {
  const preferredTab = isValidLadderTab(storedTab)
    ? storedTab
    : DEFAULT_LADDER_TAB;

  if (tabParam === undefined || tabParam === "") {
    return {
      tab: preferredTab,
      metaGame: isValidLadderMetaGame(metaGameParam) ? metaGameParam : null,
      redirectTo: ladderListPathForTab(
        preferredTab,
        isValidLadderMetaGame(metaGameParam) ? metaGameParam : null
      ),
    };
  }

  if (isValidLadderTab(tabParam)) {
    const metaGame = isValidLadderMetaGame(metaGameParam)
      ? metaGameParam
      : null;
    const redirectTo =
      metaGameParam !== undefined &&
      metaGameParam !== "" &&
      metaGame === null
        ? ladderListPathForTab(tabParam, null)
        : null;
    return { tab: tabParam, metaGame, redirectTo };
  }

  if (isValidLadderMetaGame(tabParam)) {
    return {
      tab: preferredTab,
      metaGame: tabParam,
      redirectTo: ladderListPathForTab(preferredTab, tabParam),
    };
  }

  return {
    tab: DEFAULT_LADDER_TAB,
    metaGame: null,
    redirectTo: ladderListPathForTab(DEFAULT_LADDER_TAB, null),
  };
}

export function isEmbeddedLaddersPath(pathname) {
  return pathname.startsWith("/games/") && pathname !== "/games";
}

export function resolveLadderRouteContext({
  pathname,
  tabParam,
  metaGameParam,
  storedTab,
}) {
  if (isEmbeddedLaddersPath(pathname)) {
    const metaGame = isValidLadderMetaGame(metaGameParam)
      ? metaGameParam
      : null;
    const preferredTab = isValidLadderTab(storedTab)
      ? storedTab
      : DEFAULT_LADDER_TAB;
    return {
      tab: preferredTab,
      metaGame,
      redirectTo: null,
      embedded: true,
    };
  }

  const resolved = resolveLadderRouteParams(
    tabParam,
    metaGameParam,
    storedTab
  );
  return { ...resolved, embedded: false };
}
