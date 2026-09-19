import { describe, expect, it } from "vitest";
import { normalizeCustomizationSettings } from "./normalizeCustomizationSettings.js";
import { resolveEffectiveRenderSettings } from "./resolveEffectiveRenderSettings.js";

const goRep = {
  board: { style: "vertex", width: 4, height: 4 },
  legend: { P: { name: "piece", colour: 1 } },
  pieces: "----\n----\n----\n----",
};

describe("normalizeCustomizationSettings", () => {
  it("reads render.glyphmap and render.board", () => {
    const norm = normalizeCustomizationSettings({
      render: {
        board: { style: "squares-checkered" },
        glyphmap: [["a", "b", 1]],
        options: ["hide-star-points"],
      },
    });
    expect(norm.board?.style).toBe("squares-checkered");
    expect(norm.glyphmap).to.have.length(1);
    expect(norm.options).to.deep.equal(["hide-star-points"]);
  });

  it("falls back to legacy top-level glyphmap and boardChrome", () => {
    const norm = normalizeCustomizationSettings({
      glyphmap: [["x", "y"]],
      boardChrome: { strokeWeight: 2 },
    });
    expect(norm.glyphmap[0][0]).toBe("x");
    expect(norm.board?.strokeWeight).toBe(2);
  });
});

describe("resolveEffectiveRenderSettings", () => {
  it("uses per-game settings over _default", () => {
    const globalMe = {
      customizations: {
        go: { render: { board: { style: "squares" } } },
        _default: { render: { board: { style: "squares-checkered" } } },
      },
    };
    const rs = resolveEffectiveRenderSettings(globalMe, "go", goRep);
    expect(rs.board?.style).toBe("squares");
  });

  it("drops invalid board chrome but keeps glyphmap", () => {
    const globalMe = {
      customizations: {
        go: {
          render: {
            board: { style: "squares-stacked" },
            glyphmap: [["p", "q", 1]],
          },
        },
      },
    };
    const rs = resolveEffectiveRenderSettings(globalMe, "go", goRep);
    expect(rs.board).to.equal(null);
    expect(rs.glyphmap).to.have.length(1);
  });
});
