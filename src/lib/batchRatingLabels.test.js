import { describe, expect, it, beforeAll } from "vitest";
import {
  formatBatchRatingVariantLabel,
  variantSuffixFromBatchGameKey,
} from "./batchRatingLabels";
import { setupGameslibI18nForTests } from "./testGameslibI18n";

const t = (key) =>
  key === "standingChallenge.noVariants" ? "no variants" : key;

beforeAll(() => setupGameslibI18nForTests());

describe("variantSuffixFromBatchGameKey", () => {
  it("extracts no variants suffix", () => {
    expect(variantSuffixFromBatchGameKey("chess (no variants)")).toBe(
      "no variants"
    );
  });

  it("extracts pipe-separated variant uids", () => {
    expect(variantSuffixFromBatchGameKey("go (9x9|handicap)")).toBe(
      "9x9|handicap"
    );
  });

  it("treats bare meta uid as no variants", () => {
    expect(variantSuffixFromBatchGameKey("chess")).toBe("no variants");
  });

  it("supports legacy display-name keys", () => {
    expect(variantSuffixFromBatchGameKey("Go (9x9|handicap)")).toBe(
      "9x9|handicap"
    );
  });
});

describe("formatBatchRatingVariantLabel", () => {
  it("formats no variants as empty", () => {
    expect(
      formatBatchRatingVariantLabel("chess", "chess (no variants)", t)
    ).toBe("");
    expect(formatBatchRatingVariantLabel("chess", "chess", t)).toBe("");
  });

  it("resolves variant uids via gameslib when possible", () => {
    const gameKey = "archimedes (8x10)";
    const label = formatBatchRatingVariantLabel("archimedes", gameKey, t);
    expect(label).toBe("8x10 board");
  });
});
