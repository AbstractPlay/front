import { describe, expect, it } from "vitest";
import {
  classifyCategoryTag,
  countAdvancedFilterRules,
  EMPTY_TAG_FILTER_SPEC,
  exploreTagFiltersActive,
  gameMatchesExploreTagFilters,
  gameMatchesTagFilter,
  mergeExploreTagFiltersIntoSearch,
  migrateLegacyFlatTagFilter,
  normalizeTagFilterSpec,
  parseExploreTagFiltersFromSearch,
  parseStoredExploreTagFilters,
  serializeExploreTagFiltersQuery,
  tagFilterSpecIsActive,
} from "./categoryTagFilter";

describe("classifyCategoryTag", () => {
  it("maps prefixes to dimensions", () => {
    expect(classifyCategoryTag("goal.territory")).toBe("goal");
    expect(classifyCategoryTag("mechanic>capture")).toBe("mech");
    expect(classifyCategoryTag("board>shape.hex")).toBe("board");
    expect(classifyCategoryTag("components>cards")).toBe("other");
  });
});

describe("gameMatchesTagFilter", () => {
  const cats = ["goal.territory", "mechanic>capture", "board>shape.hex"];

  it("matches any mode within a dimension", () => {
    expect(
      gameMatchesTagFilter(cats, {
        dimensions: { goal: { mode: "any", tags: ["goal.connect", "goal.territory"] } },
        exclude: [],
        groups: [],
      })
    ).toBe(true);
  });

  it("matches all mode within a dimension", () => {
    expect(
      gameMatchesTagFilter(cats, {
        dimensions: {
          goal: { mode: "all", tags: ["goal.territory", "goal.connect"] },
        },
        exclude: [],
        groups: [],
      })
    ).toBe(false);
  });

  it("matches none mode", () => {
    expect(
      gameMatchesTagFilter(cats, {
        dimensions: { board: { mode: "none", tags: ["board>none"] } },
        exclude: [],
        groups: [],
      })
    ).toBe(true);
    expect(
      gameMatchesTagFilter(cats, {
        dimensions: { board: { mode: "none", tags: ["board>shape.hex"] } },
        exclude: [],
        groups: [],
      })
    ).toBe(false);
  });

  it("applies global exclude", () => {
    expect(
      gameMatchesTagFilter(cats, {
        dimensions: {},
        exclude: ["mechanic>capture"],
        groups: [],
      })
    ).toBe(false);
  });

  it("OR groups override dimensions", () => {
    const spec = normalizeTagFilterSpec({
      dimensions: { goal: { mode: "all", tags: ["goal.connect"] } },
      exclude: [],
      groups: [
        { mode: "all", tags: ["goal.territory", "mechanic>capture"] },
        { mode: "all", tags: ["goal.connect"] },
      ],
    });
    expect(gameMatchesTagFilter(cats, spec)).toBe(true);
  });
});

describe("gameMatchesExploreTagFilters", () => {
  it("ANDs quick tag with advanced spec", () => {
    expect(
      gameMatchesExploreTagFilters(["goal.territory", "board>shape.square"], {
        quickTag: "goal.territory",
        spec: {
          dimensions: { board: { mode: "any", tags: ["board>shape.hex"] } },
          exclude: [],
          groups: [],
        },
      })
    ).toBe(false);
    expect(
      gameMatchesExploreTagFilters(["goal.territory", "board>shape.square"], {
        quickTag: "goal.territory",
        spec: EMPTY_TAG_FILTER_SPEC,
      })
    ).toBe(true);
  });
});

describe("parseStoredExploreTagFilters", () => {
  it("migrates single legacy tag to quickTag", () => {
    expect(parseStoredExploreTagFilters({ tagFilter: ["goal.territory"] })).toEqual({
      quickTag: "goal.territory",
      tagFilterSpec: normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC),
    });
  });

  it("migrates multiple legacy tags to advanced other/all", () => {
    const { quickTag, tagFilterSpec } = parseStoredExploreTagFilters({
      tagFilter: ["goal.territory", "mechanic>capture"],
    });
    expect(quickTag).toBe("");
    expect(tagFilterSpec.dimensions.other).toEqual({
      mode: "all",
      tags: ["goal.territory", "mechanic>capture"],
    });
  });
});

describe("URL codec", () => {
  it("round-trips quick and advanced params", () => {
    const filters = {
      quickTag: "goal.territory",
      tagFilterSpec: migrateLegacyFlatTagFilter(["mechanic>capture"]),
    };
    const q = serializeExploreTagFiltersQuery(filters);
    expect(q).toContain("t=goal.territory");
    expect(q).toContain("tf=2");
    const parsed = parseExploreTagFiltersFromSearch(`?${q}`);
    expect(parsed.quickTag).toBe("goal.territory");
    expect(parsed.tagFilterSpec.dimensions.other?.tags).toEqual([
      "mechanic>capture",
    ]);
  });

  it("parseExploreTagFiltersFromSearch reads t= alone", () => {
    const parsed = parseExploreTagFiltersFromSearch("?t=goal.connect");
    expect(parsed.quickTag).toBe("goal.connect");
    expect(tagFilterSpecIsActive(parsed.tagFilterSpec)).toBe(false);
  });

  it("mergeExploreTagFiltersIntoSearch preserves unrelated params", () => {
    const out = mergeExploreTagFiltersIntoSearch("?foo=1", {
      quickTag: "goal.territory",
      tagFilterSpec: EMPTY_TAG_FILTER_SPEC,
    });
    expect(out).toContain("foo=1");
    expect(out).toContain("t=goal.territory");
    expect(exploreTagFiltersActive({ quickTag: "", tagFilterSpec: EMPTY_TAG_FILTER_SPEC })).toBe(
      false
    );
  });
});

describe("countAdvancedFilterRules", () => {
  it("counts dimensions groups and exclude", () => {
    expect(
      countAdvancedFilterRules({
        dimensions: { goal: { mode: "any", tags: ["a"] } },
        exclude: ["x"],
        groups: [{ mode: "any", tags: ["b"] }],
      })
    ).toBe(3);
  });
});
