import { describe, expect, it } from "vitest";
import {
  buildDisplayNameSearchHaystack,
  buildPlayerSearchHaystack,
  getDisplayNameSearchAlias,
  queryMatchesDisplayNameSearch,
} from "./displayNameSearch";

describe("buildDisplayNameSearchHaystack", () => {
  it("includes ASCII transliteration for Cyrillic names", () => {
    const haystack = buildDisplayNameSearchHaystack("Иван");
    expect(haystack).toContain("ivan");
    expect(haystack).toContain("иван");
  });

  it("strips diacritics lane for accented Latin", () => {
    const haystack = buildDisplayNameSearchHaystack("José");
    expect(haystack).toContain("jose");
  });

  it("appends id and searchLabel extras", () => {
    const haystack = buildPlayerSearchHaystack({
      name: "Иван",
      id: "user-abc",
      searchLabel: "vanya",
    });
    expect(haystack).toContain("ivan");
    expect(haystack).toContain("user-abc");
    expect(haystack).toContain("vanya");
  });

  it("strips bot emoji before folding", () => {
    const haystack = buildDisplayNameSearchHaystack("\u{1F916} Иван");
    expect(haystack).toContain("ivan");
    expect(haystack).not.toContain("\u{1F916}");
  });
});

describe("queryMatchesDisplayNameSearch", () => {
  it("matches Latin query against Cyrillic display name", () => {
    expect(queryMatchesDisplayNameSearch("ivan", "Иван")).toBe(true);
  });

  it("matches native script substring", () => {
    expect(queryMatchesDisplayNameSearch("ив", "Иван")).toBe(true);
  });

  it("requires all tokens", () => {
    expect(queryMatchesDisplayNameSearch("ivan petrov", "Иван")).toBe(false);
  });
});

describe("getDisplayNameSearchAlias", () => {
  it("returns ASCII alias for Cyrillic names", () => {
    expect(getDisplayNameSearchAlias("Иван")).toBe("ivan");
  });

  it("returns null for accent-only Latin names", () => {
    expect(getDisplayNameSearchAlias("José")).toBeNull();
    expect(getDisplayNameSearchAlias("João")).toBeNull();
  });

  it("returns null for plain ASCII names", () => {
    expect(getDisplayNameSearchAlias("Alice")).toBeNull();
  });

  it("returns alias for mixed-script names when transliteration diverges", () => {
    expect(getDisplayNameSearchAlias("Иван Smith")).toBe("ivan smith");
  });
});
