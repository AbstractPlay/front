import { describe, expect, it } from "vitest";
import { compareStrings } from "./compareStrings";

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
