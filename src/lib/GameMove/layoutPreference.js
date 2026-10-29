import { isArenaPlayOrWatchBase } from "../arena/arenaMoveBase.js";

export const MOVE_BASE = "/move";

/** @deprecated use MOVE_BASE */
export const MOVE_CLASSIC_BASE = MOVE_BASE;

/** @deprecated preview route; redirect only */
export const MOVE_BETA_BASE = "/move-beta";

export const LAYOUT_CLASSIC = "classic";
export const LAYOUT_STRIP = "strip";
export const LAYOUT_CARD = "card";
export const LAYOUT_NARRATIVE = "narrative";
export const LAYOUT_LIVE = "live";

/** @deprecated use LAYOUT_CARD */
export const LAYOUT_QUEUE = LAYOUT_CARD;

export const ALL_LAYOUTS = [
  LAYOUT_CLASSIC,
  LAYOUT_STRIP,
  LAYOUT_CARD,
  LAYOUT_NARRATIVE,
  LAYOUT_LIVE,
];

/** @deprecated use ALL_LAYOUTS without classic */
export const BETA_LAYOUTS = [LAYOUT_STRIP, LAYOUT_CARD, LAYOUT_NARRATIVE];

export const DEFAULT_LAYOUT = LAYOUT_STRIP;

/** @deprecated use DEFAULT_LAYOUT */
export const DEFAULT_BETA_LAYOUT = DEFAULT_LAYOUT;

export const STORAGE_LAYOUT = "gameMoveLayout";
/** Arena play/watch layout (separate from correspondence `/move`). */
export const STORAGE_LAYOUT_LIVE = "gameMoveLayoutLive";
/** Set when the user picks a live-context layout (lobby, switcher, or ?layout=). */
export const STORAGE_LAYOUT_LIVE_EXPLICIT = "gameMoveLayoutLiveExplicit";
export const STORAGE_LAYOUT_HINT_DISMISSED = "gameMoveLayoutHintDismissed";

export const PLAY_CONTEXT_CORRESPONDENCE = "correspondence";
export const PLAY_CONTEXT_LIVE = "live";

export const DEFAULT_LIVE_LAYOUT = LAYOUT_LIVE;

/** @deprecated migrated to STORAGE_LAYOUT */
export const STORAGE_BETA_LAYOUT = "gameMoveBetaLayout";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / private browsing
  }
}

function normalizeLayout(layout) {
  if (layout === "queue") {
    return LAYOUT_CARD;
  }
  return layout;
}

export function inferPlayContextFromPathname(pathname = "") {
  if (/^\/arena\/(?:play|watch)\//.test(pathname)) {
    return PLAY_CONTEXT_LIVE;
  }
  return PLAY_CONTEXT_CORRESPONDENCE;
}

function storageKeyForPlayContext(playContext) {
  return playContext === PLAY_CONTEXT_LIVE ? STORAGE_LAYOUT_LIVE : STORAGE_LAYOUT;
}

function defaultLayoutForPlayContext(playContext) {
  return playContext === PLAY_CONTEXT_LIVE ? DEFAULT_LIVE_LAYOUT : DEFAULT_LAYOUT;
}

export function appendLayoutQuery(path, layout) {
  if (!layout) {
    return path;
  }
  const normalized = normalizeLayout(layout);
  if (!ALL_LAYOUTS.includes(normalized)) {
    return path;
  }
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}layout=${encodeURIComponent(normalized)}`;
}

export function gameMovePath(
  metaGame,
  cbits,
  gameID,
  { layout, beta, basePath } = {}
) {
  const moveBase = basePath ?? MOVE_BASE;
  if (beta) {
    const legacyPath = `${MOVE_BETA_BASE}/${metaGame}/${cbits}/${gameID}`;
    if (!layout || layout === LAYOUT_CLASSIC) {
      return legacyPath;
    }
    const normalized = normalizeLayout(layout);
    if (!ALL_LAYOUTS.includes(normalized)) {
      return legacyPath;
    }
    return `${legacyPath}?layout=${encodeURIComponent(normalized)}`;
  }

  const path = isArenaPlayOrWatchBase(moveBase)
    ? `${moveBase}/${metaGame}/${gameID}`
    : `${moveBase}/${metaGame}/${cbits ?? 0}/${gameID}`;
  return appendLayoutQuery(path, layout);
}

/** @deprecated unified /move/ route */
export function isBetaGameMovePath(pathname = "") {
  return pathname.startsWith(`${MOVE_BETA_BASE}/`);
}

function liveLayoutExplicitlyChosen() {
  return readStorage(STORAGE_LAYOUT_LIVE_EXPLICIT) === "1";
}

export function readLayoutPreference(
  playContext = PLAY_CONTEXT_CORRESPONDENCE,
) {
  const key = storageKeyForPlayContext(playContext);
  const fromNew = normalizeLayout(readStorage(key));
  if (ALL_LAYOUTS.includes(fromNew)) {
    if (
      playContext === PLAY_CONTEXT_LIVE
      && fromNew !== DEFAULT_LIVE_LAYOUT
      && !liveLayoutExplicitlyChosen()
    ) {
      return null;
    }
    return fromNew;
  }

  if (playContext === PLAY_CONTEXT_CORRESPONDENCE) {
    const fromLegacy = normalizeLayout(readStorage(STORAGE_BETA_LAYOUT));
    if (ALL_LAYOUTS.includes(fromLegacy)) {
      writeStorage(STORAGE_LAYOUT, fromLegacy);
      return fromLegacy;
    }
  }

  return null;
}

/** @deprecated use readLayoutPreference */
export function readBetaLayoutPreference() {
  return readLayoutPreference() ?? DEFAULT_LAYOUT;
}

export function writeLayoutPreference(
  layout,
  playContext = PLAY_CONTEXT_CORRESPONDENCE,
) {
  const normalized = normalizeLayout(layout);
  if (!ALL_LAYOUTS.includes(normalized)) {
    return;
  }
  writeStorage(storageKeyForPlayContext(playContext), normalized);
  if (playContext === PLAY_CONTEXT_LIVE) {
    writeStorage(STORAGE_LAYOUT_LIVE_EXPLICIT, "1");
  }
}

/** @deprecated use writeLayoutPreference */
export function writeBetaLayoutPreference(layout) {
  writeLayoutPreference(layout);
}

export function resolveGameMoveLayout(
  search = "",
  { playContext = PLAY_CONTEXT_CORRESPONDENCE } = {},
) {
  const params = new URLSearchParams(search);
  const fromUrl = normalizeLayout(params.get("layout"));
  if (ALL_LAYOUTS.includes(fromUrl)) {
    writeLayoutPreference(fromUrl, playContext);
    return { layoutId: fromUrl, resolvedFrom: "url" };
  }

  const stored = readLayoutPreference(playContext);
  if (stored) {
    return { layoutId: stored, resolvedFrom: "localStorage" };
  }

  return {
    layoutId: defaultLayoutForPlayContext(playContext),
    resolvedFrom: "default",
  };
}

/** @deprecated use resolveGameMoveLayout */
export function resolveBetaLayout(search = "") {
  return resolveGameMoveLayout(search).layoutId;
}

export function isLayoutHintDismissed() {
  return readStorage(STORAGE_LAYOUT_HINT_DISMISSED) === "1";
}

export function dismissLayoutHint() {
  writeStorage(STORAGE_LAYOUT_HINT_DISMISSED, "1");
}

export function shouldShowLayoutHint(resolvedFrom) {
  if (resolvedFrom !== "default") {
    return false;
  }
  if (isLayoutHintDismissed()) {
    return false;
  }
  if (readLayoutPreference()) {
    return false;
  }
  return true;
}

export function layoutLabelKey(layoutId) {
  switch (normalizeLayout(layoutId)) {
    case LAYOUT_STRIP:
      return "gameMove.layout.stripName";
    case LAYOUT_CARD:
      return "gameMove.layout.cardName";
    case LAYOUT_NARRATIVE:
      return "gameMove.layout.narrativeName";
    case LAYOUT_LIVE:
      return "gameMove.layout.liveName";
    default:
      return "gameMove.layout.classicName";
  }
}

export function layoutDescriptionKey(layoutId) {
  switch (normalizeLayout(layoutId)) {
    case LAYOUT_STRIP:
      return "gameMove.layout.stripDescription";
    case LAYOUT_CARD:
      return "gameMove.layout.cardDescription";
    case LAYOUT_NARRATIVE:
      return "gameMove.layout.narrativeDescription";
    case LAYOUT_LIVE:
      return "gameMove.layout.liveDescription";
    default:
      return "gameMove.layout.classicDescription";
  }
}
