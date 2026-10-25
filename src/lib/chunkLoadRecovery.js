import { isChunkLoadError } from "./chunkLoadError";

export const CHUNK_RELOAD_SESSION_KEY = "ap-chunk-reload-attempted";

export function chunkReloadWasAttempted() {
  if (typeof sessionStorage === "undefined") {
    return false;
  }
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Clears the one-shot guard after a successful full load (allows another retry later in the session). */
export function clearChunkReloadAttempt() {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
  } catch {
    // ignore quota / privacy mode
  }
}

function markChunkReloadAttempted() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Reload once when a lazy route chunk failed to load (stale tab after deploy).
 * @returns {boolean} true if `location.reload()` was triggered
 */
export function attemptChunkReload(error) {
  if (typeof window === "undefined") {
    return false;
  }
  if (!isChunkLoadError(error)) {
    return false;
  }
  if (chunkReloadWasAttempted()) {
    return false;
  }
  markChunkReloadAttempted();
  window.location.reload();
  return true;
}

export function installChunkLoadRecovery() {
  if (typeof window === "undefined") {
    return;
  }
  window.addEventListener("unhandledrejection", (event) => {
    if (attemptChunkReload(event.reason)) {
      event.preventDefault();
    }
  });
}
