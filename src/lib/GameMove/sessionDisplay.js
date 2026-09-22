import {
  parseSessionDisplayOverride,
  serializeSessionDisplayOverride,
} from "../displaySettings.js";

const STORAGE_PREFIX = "gameMoveDisplayOverride:";
const RELOAD_FLAG = "gameMovePageReload";

function storageKey(gameId) {
  return `${STORAGE_PREFIX}${gameId}`;
}

/** Read override after F5; no-op when arriving via in-app navigation. */
export function readSessionDisplayOverride(gameId) {
  if (sessionStorage.getItem(RELOAD_FLAG) !== "1") return null;
  sessionStorage.removeItem(RELOAD_FLAG);
  try {
    return parseSessionDisplayOverride(sessionStorage.getItem(storageKey(gameId)));
  } catch {
    return null;
  }
}

/** @param {string[]|string|null|undefined} display Active display uids or legacy string. */
export function writeSessionDisplayOverride(gameId, display) {
  try {
    const serialized = serializeSessionDisplayOverride(display);
    if (serialized == null) {
      sessionStorage.removeItem(storageKey(gameId));
    } else {
      sessionStorage.setItem(storageKey(gameId), serialized);
    }
  } catch {
    // ignore quota / private-mode errors
  }
}

export function clearSessionDisplayOverride(gameId) {
  try {
    sessionStorage.removeItem(storageKey(gameId));
  } catch {
    // ignore
  }
}

export function markGameMovePageReload() {
  try {
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // ignore
  }
}

export function isGameMovePageReload() {
  try {
    return sessionStorage.getItem(RELOAD_FLAG) === "1";
  } catch {
    return false;
  }
}
