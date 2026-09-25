import { describe, expect, it } from "vitest";
import { getEffectiveColourContext } from "./effectiveColourContext.js";

const darkBase = {
  background: "#222",
  strokes: "#6d6d6d",
  borders: "#000",
  labels: "#009fbf",
  annotations: "#99cccc",
  fill: "#e6f2f2",
};

describe("getEffectiveColourContext", () => {
  it("drops redundant global board matching saved background before merge", () => {
    const globalMe = {
      customizations: {
        _default: {
          colourContext: {
            background: "#fff",
            board: "#fff",
            strokes: "#000",
            labels: "#000",
          },
        },
      },
    };
    const effective = getEffectiveColourContext(darkBase, globalMe, "estate");
    expect(effective.background).toBe("#222");
    expect(effective.board).toBeUndefined();
    expect(effective.labels).toBe("#009fbf");
  });

  it("keeps global board when it differs from saved background", () => {
    const globalMe = {
      customizations: {
        _default: {
          colourContext: {
            background: "#fff",
            board: "#ccc",
            strokes: "#000",
          },
        },
      },
    };
    const effective = getEffectiveColourContext(darkBase, globalMe, "estate");
    expect(effective.background).toBe("#222");
    expect(effective.board).toBe("#ccc");
  });

  it("drops redundant per-game board matching saved background", () => {
    const globalMe = {
      customizations: {
        estate: {
          colourContext: {
            background: "#fff",
            board: "#fff",
            labels: "#000",
          },
        },
      },
    };
    const effective = getEffectiveColourContext(darkBase, globalMe, "estate");
    expect(effective.board).toBeUndefined();
    expect(effective.background).toBe("#fff");
    expect(effective.labels).toBe("#000");
  });
});
