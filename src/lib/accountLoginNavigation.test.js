import { describe, expect, it } from "vitest";
import { buildAccountLoginPath } from "./accountLoginNavigation";

describe("buildAccountLoginPath", () => {
  it("encodes safe returnUrl query param", () => {
    expect(buildAccountLoginPath("/game/abc")).toBe(
      "/account/login?returnUrl=%2Fgame%2Fabc",
    );
  });

  it("falls back to home for unsafe returnUrl", () => {
    expect(buildAccountLoginPath("//evil.example")).toBe(
      "/account/login?returnUrl=%2F",
    );
  });
});