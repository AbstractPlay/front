export const MOVE_BASE = "/move";

/** @deprecated use MOVE_BASE */
export const MOVE_CLASSIC_BASE = MOVE_BASE;

/** @deprecated preview route; redirect only */
export const MOVE_BETA_BASE = "/move-beta";

export const LAYOUT_CLASSIC = "classic";
export const LAYOUT_STRIP = "strip";
export const LAYOUT_CARD = "card";
export const LAYOUT_NARRATIVE = "narrative";

/** @deprecated use LAYOUT_CARD */
export const LAYOUT_QUEUE = LAYOUT_CARD;

export const ALL_LAYOUTS = [
  LAYOUT_CLASSIC,
  LAYOUT_STRIP,
  LAYOUT_CARD,
  LAYOUT_NARRATIVE,
];

/** @deprecated use ALL_LAYOUTS without classic */
export const BETA_LAYOUTS = [LAYOUT_STRIP, LAYOUT_CARD, LAYOUT_NARRATIVE];

export const DEFAULT_LAYOUT = LAYOUT_STRIP;

/** @deprecated use DEFAULT_LAYOUT */
export const DEFAULT_BETA_LAYOUT = DEFAULT_LAYOUT;

export const STORAGE_LAYOUT = "gameMoveLayout";
export const STORAGE_LAYOUT_HINT_DISMISSED = "gameMoveLayoutHintDismissed";

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

export function gameMovePath(metaGame, cbits, gameID, { layout, beta } = {}) {
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

  const path = `${MOVE_BASE}/${metaGame}/${cbits}/${gameID}`;
  if (!layout) {
    return path;
  }
  const normalized = normalizeLayout(layout);
  if (!ALL_LAYOUTS.includes(normalized)) {
    return path;
  }
  return `${path}?layout=${encodeURIComponent(normalized)}`;
}

/** @deprecated unified /move/ route */
export function isBetaGameMovePath(pathname = "") {
  return pathname.startsWith(`${MOVE_BETA_BASE}/`);
}

export function readLayoutPreference() {
  const fromNew = normalizeLayout(readStorage(STORAGE_LAYOUT));
  if (ALL_LAYOUTS.includes(fromNew)) {
    return fromNew;
  }

  const fromLegacy = normalizeLayout(readStorage(STORAGE_BETA_LAYOUT));
  if (ALL_LAYOUTS.includes(fromLegacy)) {
    writeStorage(STORAGE_LAYOUT, fromLegacy);
    return fromLegacy;
  }

  return null;
}

/** @deprecated use readLayoutPreference */
export function readBetaLayoutPreference() {
  return readLayoutPreference() ?? DEFAULT_LAYOUT;
}

export function writeLayoutPreference(layout) {
  const normalized = normalizeLayout(layout);
  if (!ALL_LAYOUTS.includes(normalized)) {
    return;
  }
  writeStorage(STORAGE_LAYOUT, normalized);
}

/** @deprecated use writeLayoutPreference */
export function writeBetaLayoutPreference(layout) {
  writeLayoutPreference(layout);
}

export function resolveGameMoveLayout(search = "") {
  const params = new URLSearchParams(search);
  const fromUrl = normalizeLayout(params.get("layout"));
  if (ALL_LAYOUTS.includes(fromUrl)) {
    writeLayoutPreference(fromUrl);
    return { layoutId: fromUrl, resolvedFrom: "url" };
  }

  const stored = readLayoutPreference();
  if (stored) {
    return { layoutId: stored, resolvedFrom: "localStorage" };
  }

  return { layoutId: DEFAULT_LAYOUT, resolvedFrom: "default" };
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
    default:
      return "gameMove.layout.classicDescription";
  }
}
