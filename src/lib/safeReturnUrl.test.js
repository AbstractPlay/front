import { describe, expect, it } from "vitest";
import { readReturnUrlFromSearch, safeReturnUrl } from "./safeReturnUrl";

describe("safeReturnUrl", () => {
  it("allows relative in-app paths", () => {
    expect(safeReturnUrl("/games/hex")).toBe("/games/hex");
    expect(safeReturnUrl("/move/chess/0/123?x=1")).toBe("/move/chess/0/123?x=1");
    expect(safeReturnUrl("/move/chess/0/123#frag")).toBe("/move/chess/0/123#frag");
  });

  it("rejects external and protocol tricks", () => {
    expect(safeReturnUrl("//evil.com")).toBe("/");
    expect(safeReturnUrl("https://evil.com")).toBe("/");
    expect(safeReturnUrl("/\\evil.com")).toBe("/");
    expect(safeReturnUrl("/javascript:alert(1)")).toBe("/");
    expect(safeReturnUrl("/data:text/html,hi")).toBe("/");
  });

  it("rejects empty and non-strings", () => {
    expect(safeReturnUrl("")).toBe("/");
    expect(safeReturnUrl(null)).toBe("/");
    expect(safeReturnUrl(undefined, "/home")).toBe("/home");
  });
});

describe("readReturnUrlFromSearch", () => {
  it("parses returnUrl query param", () => {
    expect(readReturnUrlFromSearch("?returnUrl=%2Fgames%2Fhex")).toBe("/games/hex");
    expect(readReturnUrlFromSearch("returnUrl=%2Fplay")).toBe("/play");
    expect(readReturnUrlFromSearch("?foo=1")).toBe(null);
  });
});