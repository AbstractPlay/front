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
});
