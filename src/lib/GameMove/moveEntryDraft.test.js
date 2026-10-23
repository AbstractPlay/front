import { describe, expect, it } from "vitest";
import { appendMovePartToDraft } from "./moveEntryDraft";

describe("appendMovePartToDraft", () => {
  it("concatenates when no handler", () => {
    expect(appendMovePartToDraft("ab", "cd")).toBe("abcd");
    expect(appendMovePartToDraft("", "x")).toBe("x");
  });

  it("uses handler when provided", () => {
    expect(
      appendMovePartToDraft("a", "b", (cur, part) => `${cur}|${part}`)
    ).toBe("a|b");
  });
});
