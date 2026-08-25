import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import {
  formatBatchRatingVariantLabel,
  variantSuffixFromBatchGameKey,
} from "./batchRatingLabels";

const t = (key) =>
  key === "standingChallenge.noVariants" ? "no variants" : key;

describe("variantSuffixFromBatchGameKey", () => {
  it("extracts no variants suffix", () => {
    expect(variantSuffixFromBatchGameKey("Chess (no variants)", "Chess")).toBe(
      "no variants"
    );
  });

  it("extracts pipe-separated variant uids", () => {
    expect(variantSuffixFromBatchGameKey("Go (9x9|handicap)", "Go")).toBe(
      "9x9|handicap"
    );
  });

  it("treats bare meta name as no variants", () => {
    expect(variantSuffixFromBatchGameKey("Chess", "Chess")).toBe("no variants");
  });
});

describe("formatBatchRatingVariantLabel", () => {
  it("formats no variants", () => {
    expect(
      formatBatchRatingVariantLabel(
        "chess",
        "Chess (no variants)",
        "Chess",
        t
      )
    ).toBe("no variants");
  });

  it("resolves variant uids via gameslib when possible", () => {
    const info = [...gameinfo.values()].find((g) =>
      g.variants?.some((v) => v.name)
    );
    expect(info).toBeDefined();
    const variant = info.variants.find((v) => v.name);
    const gameKey = `${info.name} (${variant.uid})`;
    const label = formatBatchRatingVariantLabel(
      info.uid,
      gameKey,
      info.name,
      t
    );
    expect(label).toBe(variant.name);
  });
});
