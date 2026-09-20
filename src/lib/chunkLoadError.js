const CHUNK_LOAD_MESSAGE_PATTERNS = [
  /loading chunk/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /expected a javascript-or-wasm module script/i,
];

function messageLooksLikeChunkLoad(message) {
  if (typeof message !== "string" || message.length === 0) {
    return false;
  }
  return CHUNK_LOAD_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * True when a lazy route/chunk failed to load (stale deploy, missing asset, SPA HTML fallback).
 * Covers webpack ChunkLoadError and Vite/browser dynamic import failures.
 */
export function isChunkLoadError(error) {
  if (!error) {
    return false;
  }
  if (error.name === "ChunkLoadError") {
    return true;
  }
  if (messageLooksLikeChunkLoad(error.message)) {
    return true;
  }
  if (error.cause) {
    return isChunkLoadError(error.cause);
  }
  return false;
}
