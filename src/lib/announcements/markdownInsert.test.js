import { describe, expect, it } from "vitest";
import { insertAtSelection } from "./markdownInsert";

describe("insertAtSelection", () => {
  it("wraps selected text", () => {
    const el = document.createElement("textarea");
    el.value = "hello world";
    el.selectionStart = 0;
    el.selectionEnd = 5;
    const next = insertAtSelection(el, "**", "**");
    expect(next).toBe("**hello** world");
  });
});
