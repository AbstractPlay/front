import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHUNK_RELOAD_SESSION_KEY,
  attemptChunkReload,
  chunkReloadWasAttempted,
  clearChunkReloadAttempt,
} from "./chunkLoadRecovery";

describe("chunkLoadRecovery", () => {
  const storage = new Map();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("sessionStorage", {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    });
    vi.stubGlobal("location", { reload: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reloads once on chunk load errors", () => {
    const error = new TypeError("Failed to fetch dynamically imported module: /a.js");
    expect(attemptChunkReload(error)).toBe(true);
    expect(location.reload).toHaveBeenCalledTimes(1);
    expect(chunkReloadWasAttempted()).toBe(true);
  });

  it("does not reload twice in the same episode", () => {
    const error = new Error("Loading chunk 9 failed.");
    expect(attemptChunkReload(error)).toBe(true);
    expect(attemptChunkReload(error)).toBe(false);
    expect(location.reload).toHaveBeenCalledTimes(1);
  });

  it("ignores non-chunk errors", () => {
    expect(attemptChunkReload(new Error("boom"))).toBe(false);
    expect(location.reload).not.toHaveBeenCalled();
    expect(storage.has(CHUNK_RELOAD_SESSION_KEY)).toBe(false);
  });

  it("clearChunkReloadAttempt resets the guard", () => {
    storage.set(CHUNK_RELOAD_SESSION_KEY, "1");
    clearChunkReloadAttempt();
    expect(chunkReloadWasAttempted()).toBe(false);
    const error = new Error("Importing a module script failed.");
    expect(attemptChunkReload(error)).toBe(true);
    expect(location.reload).toHaveBeenCalledTimes(1);
  });
});
