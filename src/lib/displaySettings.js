import {
  gameinfo,
  isSimpleDisplayCycleGame,
  nextDisplayCycleStep,
  sanitizeDisplaySelection,
} from "@abstractplay/gameslib";

/** @returns {string[]} Active display uids; empty = default renderer. */
export function normalizeDisplaySetting(raw) {
  if (raw === undefined || raw === null || raw === "default") {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter(
      (uid) => typeof uid === "string" && uid !== "" && uid !== "default"
    );
  }
  if (typeof raw === "string") {
    if (raw === "" || raw === "default") {
      return [];
    }
    return [raw];
  }
  return [];
}

export function displaySettingEqual(a, b) {
  const left = normalizeDisplaySetting(a).slice().sort();
  const right = normalizeDisplaySetting(b).slice().sort();
  if (left.length !== right.length) {
    return false;
  }
  return left.every((uid, index) => uid === right[index]);
}

export function sanitizeDisplayForGame(metaGame, activeUids) {
  const normalized = normalizeDisplaySetting(activeUids);
  const info = gameinfo.get(metaGame);
  const defs = info?.displays;
  if (!defs?.length) {
    return normalized;
  }
  return sanitizeDisplaySelection(defs, normalized);
}

/**
 * Render opts for engine.render(), including legacy altDisplay when a single uid is active.
 * @param {string} metaGame
 * @param {string|string[]|undefined|null} displayUids
 * @param {Record<string, unknown>} [extraOpts]
 */
export function buildRenderDisplayOpts(metaGame, displayUids, extraOpts = {}) {
  const altDisplays = sanitizeDisplayForGame(metaGame, displayUids);
  const opts = { ...extraOpts };
  if (altDisplays.length > 0) {
    opts.altDisplays = altDisplays;
    if (altDisplays.length === 1) {
      opts.altDisplay = altDisplays[0];
    }
  }
  return opts;
}

/** Map stored settings to RenderOptionsModal radio value. */
export function displaySettingForModal(raw) {
  const uids = normalizeDisplaySetting(raw);
  if (uids.length === 0) {
    return "default";
  }
  if (uids.length === 1) {
    return uids[0];
  }
  return "default";
}

/** Map modal radio value to persisted settings (string[]). */
export function displaySettingFromModal(modalValue) {
  if (modalValue === undefined || modalValue === null || modalValue === "default") {
    return [];
  }
  return normalizeDisplaySetting(modalValue);
}

export function serializeSessionDisplayOverride(displayUids) {
  const normalized = normalizeDisplaySetting(displayUids);
  if (normalized.length === 0) {
    return null;
  }
  return JSON.stringify(normalized);
}

/** True when the board FAB may cycle default vs one projection group. */
export function canCycleBoardDisplay(metaGame) {
  const info = gameinfo.get(metaGame);
  return isSimpleDisplayCycleGame(info?.displays);
}

/** Next display selection for FAB cycling on simple projection games. */
export function nextBoardDisplayCycle(metaGame, current) {
  const info = gameinfo.get(metaGame);
  return nextDisplayCycleStep(info?.displays, normalizeDisplaySetting(current));
}

export function parseSessionDisplayOverride(stored) {
  if (stored == null || stored === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      const normalized = normalizeDisplaySetting(parsed);
      return normalized.length > 0 ? normalized : null;
    }
  } catch {
    // legacy plain string uid
  }
  const legacy = normalizeDisplaySetting(stored);
  return legacy.length > 0 ? legacy : null;
}
