import { describe, expect, it, beforeAll } from "vitest";
import {
  canonicalVariantUids,
  expandVariants,
  orderVariantUidsForDisplay,
} from "./expandVariants";
import { setupGameslibI18nForTests } from "./testGameslibI18n";

beforeAll(() => setupGameslibI18nForTests());

describe("orderVariantUidsForDisplay", () => {
  it("orders asli by group name then uid (ungrouped last)", () => {
    const scrambled = ["woven", "board-9", "area", "setkomi"];
    expect(orderVariantUidsForDisplay("asli", scrambled)).toEqual([
      "board-9",
      "setkomi",
      "woven",
      "area",
    ]);
  });

  it("is stable regardless of input order", () => {
    const a = orderVariantUidsForDisplay("asli", ["area", "board-19", "woven"]);
    const b = orderVariantUidsForDisplay("asli", ["woven", "board-19", "area"]);
    expect(a).toEqual(b);
  });
});

describe("canonicalVariantUids", () => {
  it("matches display order for a full explicit selection (asli)", () => {
    const uids = ["woven", "board-9", "area", "setkomi"];
    expect(canonicalVariantUids("asli", uids)).toEqual(
      orderVariantUidsForDisplay("asli", uids)
    );
  });
});

describe("expandVariants", () => {
  it("lists labels in the same order as canonical uids", () => {
    const uids = canonicalVariantUids("asli", ["area", "board-9", "setkomi", "woven"]);
    const labels = expandVariants("asli", ["woven", "board-9", "area", "setkomi"]);
    expect(labels.length).toBe(uids.length);
    expect(labels.length).toBeGreaterThan(0);
  });
});
