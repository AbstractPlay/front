import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "./chunkLoadError";

describe("isChunkLoadError", () => {
  it("detects webpack ChunkLoadError by name", () => {
    expect(isChunkLoadError({ name: "ChunkLoadError", message: "x" })).toBe(true);
  });

  it("detects webpack loading chunk message", () => {
    expect(isChunkLoadError(new Error("Loading chunk 42 failed."))).toBe(true);
  });

  it("detects Vite dynamic import failure", () => {
    const error = new TypeError(
      "Failed to fetch dynamically imported module: https://play.abstractplay.com/static/js/Stats--u0GbXlQ.js",
    );
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("detects Safari dynamic import message", () => {
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
  });

  it("detects MIME type module script errors", () => {
    expect(isChunkLoadError(new Error(
      "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of \"text/html\".",
    ))).toBe(true);
  });

  it("follows error.cause", () => {
    const cause = new TypeError("Failed to fetch dynamically imported module: /static/js/foo.js");
    expect(isChunkLoadError({ name: "Error", message: "wrapper", cause })).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError({ name: "TypeError", message: "Cannot read properties of undefined" })).toBe(false);
  });
});
