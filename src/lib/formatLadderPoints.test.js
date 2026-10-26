import { describe, expect, it } from "vitest";
import {
  formatLadderPoints,
  formatLadderPointsDelta,
} from "./formatLadderPoints.js";

describe("formatLadderPoints", () => {
  it("rounds to two decimal places", () => {
    expect(formatLadderPoints(1000.126)).toMatch(/1[,.]?000\.13/);
    expect(formatLadderPoints(42.126)).toMatch(/42\.13/);
    expect(formatLadderPoints(42)).toMatch(/^42$/);
  });

  it("handles non-finite input as zero", () => {
    expect(formatLadderPoints(Number.NaN)).toBe("0");
  });
});

describe("formatLadderPointsDelta", () => {
  it("prefixes sign for gains and losses", () => {
    expect(formatLadderPointsDelta(3.456)).toMatch(/^\+3\.46$/);
    expect(formatLadderPointsDelta(-2.344)).toMatch(/^-2\.34$/);
    expect(formatLadderPointsDelta(0)).toMatch(/^0$/);
  });
});
