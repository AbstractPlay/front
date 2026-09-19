import { describe, expect, it } from "vitest";
import {
  ALL_CUSTOMIZATION_SECTIONS,
  mergeCustomizationSections,
} from "./mergeCustomizationSections.js";

describe("mergeCustomizationSections", () => {
  const target = {
    palette: ["#111111"],
    colourContext: { background: "#aaaaaa" },
    render: {
      board: { strokeWeight: 1 },
      glyphmap: [["a", "b"]],
    },
    glyphmap: [["legacy", "row"]],
    preferredColour: "#ff0000",
    customCss: { css: "old", active: true },
  };

  const source = {
    palette: ["#e31a1c", "#1f78b4"],
    colourContext: { background: "#ffffff", board: "#eeeeee" },
    render: {
      board: { style: "squares-checkered", labelScale: 1.5 },
      glyphmap: [["x", "y", 2]],
      options: ["hide-star-points"],
    },
    preferredColour: "#33a02c",
    customCss: { css: "div._meta_foo {}", active: false },
  };

  it("copies only selected sections", () => {
    const merged = mergeCustomizationSections(target, source, {
      palette: true,
      colourContext: false,
      render: false,
      preferredColour: false,
      customCss: false,
    });
    expect(merged.palette).toEqual(["#e31a1c", "#1f78b4"]);
    expect(merged.render).toEqual(target.render);
    expect(merged.customCss).toEqual({ css: "old", active: true });
  });

  it("copies render and drops legacy glyphmap on target", () => {
    const merged = mergeCustomizationSections(target, source, {
      render: true,
    });
    expect(merged.render).toEqual(source.render);
    expect(merged).not.toHaveProperty("glyphmap");
    expect(merged.palette).toEqual(["#111111"]);
  });

  it("builds render from legacy source glyphmap and boardChrome", () => {
    const legacySource = {
      glyphmap: [["p", "meeple", 1]],
      boardChrome: { strokeWeight: 2 },
    };
    const merged = mergeCustomizationSections({}, legacySource, {
      render: true,
    });
    expect(merged.render).toEqual({
      board: { strokeWeight: 2 },
      glyphmap: [["p", "meeple", 1]],
    });
  });

  it("merges customCss when selected", () => {
    const merged = mergeCustomizationSections(target, source, {
      customCss: true,
    });
    expect(merged.customCss).toEqual({ css: "div._meta_foo {}", active: false });
    expect(merged.palette).toEqual(["#111111"]);
  });

  it("deletes preferredColour when source has none and section selected", () => {
    const merged = mergeCustomizationSections(
      target,
      { ...source, preferredColour: null },
      { preferredColour: true },
    );
    expect(merged).not.toHaveProperty("preferredColour");
  });

  it("deletes customCss when source has none and section selected", () => {
    const merged = mergeCustomizationSections(
      target,
      { ...source, customCss: undefined },
      { customCss: true },
    );
    expect(merged).not.toHaveProperty("customCss");
  });

  it("starts from empty target", () => {
    const merged = mergeCustomizationSections({}, source, ALL_CUSTOMIZATION_SECTIONS);
    expect(merged.palette).toEqual(source.palette);
    expect(merged.render).toEqual(source.render);
    expect(merged.customCss).toEqual(source.customCss);
  });
});
