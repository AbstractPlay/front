import { describe, expect, it } from "vitest";
import { compareStrings, stringColumnSortingFn } from "./compareStrings";

describe("compareStrings", () => {
  it("sorts Esperanto words with eo collation rules", () => {
    const words = ["Zamenhof", "cirkaŭ", "ĉirkaŭ", "dormi", "ĉevalo"];
    const sorted = [...words].sort((a, b) => compareStrings(a, b, "eo"));
    expect(sorted).toEqual([
      "cirkaŭ",
      "ĉevalo",
      "ĉirkaŭ",
      "dormi",
      "Zamenhof",
    ]);
  });

  it("treats nullish values as empty strings", () => {
    expect(compareStrings(null, "a", "en")).toBeLessThan(0);
    expect(compareStrings("a", undefined, "en")).toBeGreaterThan(0);
  });

  it("coerces non-string operands", () => {
    expect(compareStrings(10, 2, "en")).toBeLessThan(0);
    expect(compareStrings("a", /** @type {*} */ (["x"]), "en")).toBeLessThan(0);
  });

  it("falls back to en for non-string locale tags", () => {
    expect(() => compareStrings("a", "b", /** @type {*} */ ({}))).not.toThrow();
  });
});

describe("stringColumnSortingFn", () => {
  /** Minimal stand-in for a TanStack Table row. */
  const row = (value) => ({ getValue: () => value });

  it("keeps eo hat letters after their base letter, not after z", () => {
    const names = ["Ŝiparoj", "Cubeo", "Zola", "Ĉaso", "Symple"];
    const sortingFn = stringColumnSortingFn("eo");
    const sorted = names
      .map(row)
      .sort((a, b) => sortingFn(a, b, "gameName"))
      .map((r) => r.getValue());
    // Ĉ follows C, Ŝ follows S — and Zola stays last.
    expect(sorted).toEqual(["Cubeo", "Ĉaso", "Symple", "Ŝiparoj", "Zola"]);
  });

  it("tolerates nullish cell values", () => {
    const sortingFn = stringColumnSortingFn("eo");
    expect(sortingFn(row(null), row("a"), "c")).toBeLessThan(0);
    expect(sortingFn(row("a"), row(undefined), "c")).toBeGreaterThan(0);
  });
});
