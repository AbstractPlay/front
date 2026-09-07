import { describe, expect, it } from "vitest";
import {
  ALL_CUSTOMIZATION_SECTIONS,
  mergeCustomizationSections,
} from "./mergeCustomizationSections.js";

describe("mergeCustomizationSections", () => {
  const target = {
    palette: ["#111111"],
    colourContext: { background: "#aaaaaa" },
    glyphmap: [["a", "b"]],
    preferredColour: "#ff0000",
    customCss: { css: "old", active: true },
  };

  const source = {
    palette: ["#e31a1c", "#1f78b4"],
    colourContext: { background: "#ffffff", board: "#eeeeee" },
    glyphmap: [["x", "y", 2]],
    preferredColour: "#33a02c",
    customCss: { css: "div._meta_foo {}", active: false },
  };

  it("copies only selected sections", () => {
    const merged = mergeCustomizationSections(target, source, {
      palette: true,
      colourContext: false,
      glyphmap: false,
      preferredColour: false,
      customCss: false,
    });
    expect(merged.palette).toEqual(["#e31a1c", "#1f78b4"]);
    expect(merged.glyphmap).toEqual([["a", "b"]]);
    expect(merged.customCss).toEqual({ css: "old", active: true });
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
      { preferredColour: true }
    );
    expect(merged).not.toHaveProperty("preferredColour");
  });

  it("deletes customCss when source has none and section selected", () => {
    const merged = mergeCustomizationSections(
      target,
      { ...source, customCss: undefined },
      { customCss: true }
    );
    expect(merged).not.toHaveProperty("customCss");
  });

  it("starts from empty target", () => {
    const merged = mergeCustomizationSections({}, source, ALL_CUSTOMIZATION_SECTIONS);
    expect(merged.palette).toEqual(source.palette);
    expect(merged.customCss).toEqual(source.customCss);
  });
});
