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
    return sessionStorage.getItem(storageKey(gameId));
  } catch {
    return null;
  }
}

export function writeSessionDisplayOverride(gameId, display) {
  try {
    if (display == null) {
      sessionStorage.removeItem(storageKey(gameId));
    } else {
      sessionStorage.setItem(storageKey(gameId), display);
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
