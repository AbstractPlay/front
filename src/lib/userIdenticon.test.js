import { describe, expect, it } from "vitest";
import { hashUserSeed, identiconGrid, identiconHue } from "./userIdenticon";

describe("userIdenticon", () => {
  it("returns stable hue and grid for the same seed", () => {
    const seed = "user-abc-123";
    expect(identiconHue(seed)).toBe(identiconHue(seed));
    expect(identiconGrid(seed)).toEqual(identiconGrid(seed));
  });

  it("returns hue in 0..359", () => {
    expect(identiconHue("any-id")).toBeGreaterThanOrEqual(0);
    expect(identiconHue("any-id")).toBeLessThan(360);
  });

  it("produces a 5x5 grid with vertical symmetry", () => {
    const grid = identiconGrid("symmetry-check");
    expect(grid).toHaveLength(5);
    for (const row of grid) {
      expect(row).toHaveLength(5);
      expect(row[0]).toBe(row[4]);
      expect(row[1]).toBe(row[3]);
    }
  });

  it("never returns an empty grid", () => {
    const grid = identiconGrid(String(hashUserSeed("empty-grid-probe")));
    expect(grid.some((row) => row.some(Boolean))).toBe(true);
  });
});
