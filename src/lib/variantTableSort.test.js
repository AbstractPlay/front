import { describe, expect, it, beforeAll } from "vitest";
import { compareStrings } from "./compareStrings";
import {
  compareClockTriple,
  compareSummaryGameKeys,
  compareVariantSelections,
} from "./variantTableSort";
import { setupGameslibI18nForTests } from "./testGameslibI18n";

beforeAll(() => setupGameslibI18nForTests());

describe("compareVariantSelections", () => {
  it("orders asli boards by numeric uid segments", () => {
    const boards = ["board-27", "board-9", "board-11", "board-19"];
    const sorted = [...boards].sort((a, b) =>
      compareVariantSelections("asli", [a], [b], "en")
    );
    expect(sorted).toEqual(["board-9", "board-11", "board-19", "board-27"]);
  });

  it("is stable for permuted full asli selections", () => {
    const a = ["woven", "board-9", "area", "setkomi"];
    const b = ["board-9", "setkomi", "woven", "area"];
    expect(compareVariantSelections("asli", a, b, "en")).toBe(0);
  });

  it("differs across meta games", () => {
    expect(
      compareVariantSelections("asli", ["board-9"], ["board-9"], "en")
    ).toBe(0);
    expect(
      compareVariantSelections("asli", ["board-9"], ["board-9"], "en")
    ).toBe(0);
    expect(
      compareVariantSelections("asli", ["board-9"], [], "en") !== 0 ||
        compareVariantSelections("chess", [], ["board-9"], "en") !== 0
    ).toBe(true);
  });
});

describe("compareSummaryGameKeys", () => {
  it("orders chess before go and treats permuted go keys as equal", () => {
    const keys = ["go (9x9|handicap)", "go (handicap|9x9)", "chess (no variants)"];
    const sorted = [...keys].sort((a, b) =>
      compareSummaryGameKeys(a, b, "en")
    );
    expect(sorted[0]).toBe("chess (no variants)");
    expect(compareSummaryGameKeys(sorted[1], sorted[2], "en")).toBe(0);
  });
});

describe("compareClockTriple", () => {
  it("sorts by start then inc then max", () => {
    expect(compareClockTriple(5, 10, 60, 48, 24, 96)).toBeLessThan(0);
    expect(compareClockTriple(48, 24, 96, 72, 24, 240)).toBeLessThan(0);
    expect(compareClockTriple(48, 24, 96, 48, 30, 96)).toBeLessThan(0);
  });

  it("orders 5/10/60 before 48/24/96 numerically", () => {
    expect(compareClockTriple(5, 10, 60, 48, 24, 96)).toBeLessThan(0);
    expect(compareStrings("48/24/96", "5/10/60", "en")).toBeGreaterThan(0);
  });
});
