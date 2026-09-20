import { describe, expect, it } from "vitest";
import { normalizeCustomizationSettings } from "./normalizeCustomizationSettings.js";

/** Documents Customize save shape: `render` must survive normalization (Phase 2). */
describe("customize settings roundtrip", () => {
  it("keeps render.board when present in saved settings", () => {
    const saved = {
      colourContext: { background: "#222", board: "#222", strokes: "#6d6d6d" },
      palette: [],
      glyphmap: [],
      render: { board: { style: "vertex" } },
    };
    const norm = normalizeCustomizationSettings(saved);
    expect(norm.board?.style).toBe("vertex");
  });
});
