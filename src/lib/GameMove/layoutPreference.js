export const MOVE_CLASSIC_BASE = "/move";
export const MOVE_BETA_BASE = "/move-beta";

export const LAYOUT_CLASSIC = "classic";
export const LAYOUT_STRIP = "strip";
export const LAYOUT_CARD = "card";
export const LAYOUT_NARRATIVE = "narrative";

/** @deprecated use LAYOUT_CARD */
export const LAYOUT_QUEUE = LAYOUT_CARD;

export const BETA_LAYOUTS = [LAYOUT_STRIP, LAYOUT_CARD, LAYOUT_NARRATIVE];
export const DEFAULT_BETA_LAYOUT = LAYOUT_STRIP;

export const STORAGE_BANNER_DISMISSED = "gameMoveBetaBannerDismissed";
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

function normalizeBetaLayout(layout) {
  if (layout === "queue") {
    return LAYOUT_CARD;
  }
  return layout;
}

export function gameMovePath(
  metaGame,
  cbits,
  gameID,
  { beta = false, layout } = {}
) {
  const base = beta ? MOVE_BETA_BASE : MOVE_CLASSIC_BASE;
  const path = `${base}/${metaGame}/${cbits}/${gameID}`;
  if (!beta || !layout || layout === LAYOUT_CLASSIC) {
    return path;
  }
  const normalized = normalizeBetaLayout(layout);
  if (!BETA_LAYOUTS.includes(normalized)) {
    return path;
  }
  return `${path}?layout=${encodeURIComponent(normalized)}`;
}

export function isBetaGameMovePath(pathname = "") {
  return pathname.startsWith(`${MOVE_BETA_BASE}/`);
}

export function readBetaLayoutPreference() {
  const stored = normalizeBetaLayout(readStorage(STORAGE_BETA_LAYOUT));
  if (BETA_LAYOUTS.includes(stored)) {
    return stored;
  }
  return DEFAULT_BETA_LAYOUT;
}

export function writeBetaLayoutPreference(layout) {
  const normalized = normalizeBetaLayout(layout);
  if (!BETA_LAYOUTS.includes(normalized)) {
    return;
  }
  writeStorage(STORAGE_BETA_LAYOUT, normalized);
}

export function resolveBetaLayout(search = "") {
  const params = new URLSearchParams(search);
  const fromUrl = normalizeBetaLayout(params.get("layout"));
  if (BETA_LAYOUTS.includes(fromUrl)) {
    writeBetaLayoutPreference(fromUrl);
    return fromUrl;
  }
  return readBetaLayoutPreference();
}

export function isExperimentBannerDismissed() {
  return readStorage(STORAGE_BANNER_DISMISSED) === "1";
}

export function dismissExperimentBanner() {
  writeStorage(STORAGE_BANNER_DISMISSED, "1");
}

export function resetExperimentBannerDismissal() {
  try {
    localStorage.removeItem(STORAGE_BANNER_DISMISSED);
  } catch {
    // ignore
  }
}

export function layoutLabelKey(layoutId) {
  switch (normalizeBetaLayout(layoutId)) {
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
  switch (normalizeBetaLayout(layoutId)) {
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
