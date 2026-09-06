import { describe, expect, it } from "vitest";
import { setRendererColourOpts } from "./setRendererColourOpts.js";

describe("setRendererColourOpts", () => {
  it("ignores legacy globalMe.palettes and does not set colourBlind without customizations", () => {
    const options = {};
    setRendererColourOpts({
      options,
      metaGame: "bide",
      isParticipant: 0,
      context: {},
      globalMe: {
        palettes: [
          { name: "My Red", colours: ["#e31a1c", "#1f78b4", "#33a02c"] },
        ],
        customizations: {},
      },
      numPlayers: 3,
    });
    expect(options.colours).toBeUndefined();
    expect(options.colourBlind).toBeUndefined();
  });

  it("applies customization palette when present", () => {
    const palette = ["#e31a1c", "#1f78b4", "#33a02c"];
    const options = {};
    setRendererColourOpts({
      options,
      metaGame: "bide",
      isParticipant: 0,
      context: {},
      globalMe: {
        palettes: [{ name: "My Red", colours: ["#000000"] }],
        customizations: { _default: { palette } },
      },
      numPlayers: 3,
    });
    expect(options.colours?.slice(0, 3)).toEqual(palette);
    expect(options.coloursGlobal).toBe(true);
  });

  it("applies preferred colour swap when only preferredColour is customized", () => {
    const BROWN = "#b15928";
    const options = {};
    setRendererColourOpts({
      options,
      metaGame: "bide",
      isParticipant: 0,
      context: {},
      globalMe: {
        customizations: {
          _default: { preferredColour: BROWN },
        },
      },
      numPlayers: 2,
    });
    expect(options.colours?.[0]).toBe(BROWN);
    expect(options.coloursGlobal).toBe(true);
  });

  it("per-game preferred colour sets coloursGlobal false for custom-colours games", () => {
    const YELLOW = "#ffff99";
    const acityHints = [
      { num: 1, default: 1 },
      { num: 2, default: 2 },
      { num: 3, default: 3 },
      { num: 4, default: "#000" },
      { num: 5, default: "#fff", player: 1 },
      { num: 6, default: "#000", player: 2 },
    ];
    const options = {};
    setRendererColourOpts({
      options,
      metaGame: "acity",
      isParticipant: 0,
      context: {},
      globalMe: {
        customizations: {
          acity: { palette: [], preferredColour: YELLOW },
        },
      },
      engine: {
        getPlayerColour: (p) =>
          p === 1 ? { palette: 5, default: "#fff" } : { palette: 6, default: "#000" },
      },
      numPlayers: 2,
      customizationHints: acityHints,
    });
    expect(options.coloursGlobal).toBe(false);
    expect(options.colours?.[3]).toBe("#000");
    expect(options.colours?.[4]).toBe(YELLOW);
  });
});
