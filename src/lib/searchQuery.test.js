import { describe, expect, it } from "vitest";
import {
  normalizeSearchQuery,
  queryMatchesHaystack,
  searchTokens,
} from "./searchQuery";

describe("normalizeSearchQuery", () => {
  it("lowercases and trims", () => {
    expect(normalizeSearchQuery("  ArImAa  ")).toBe("arimaa");
  });
});

describe("searchTokens", () => {
  it("splits normalized words", () => {
    expect(searchTokens("  Lines   OF  ")).toEqual(["lines", "of"]);
  });
});

describe("queryMatchesHaystack", () => {
  it("matches case-insensitively on query and haystack", () => {
    expect(queryMatchesHaystack("ARIMAA", "Arimaa")).toBe(true);
    expect(queryMatchesHaystack("arimaa", "Arimaa")).toBe(true);
    expect(queryMatchesHaystack("chess", "Chess")).toBe(true);
  });

  it("requires every token with case-insensitive haystack", () => {
    expect(queryMatchesHaystack("Lines Action", "Lines of Action")).toBe(true);
    expect(queryMatchesHaystack("LINES action", "lines of action")).toBe(true);
  });
});
