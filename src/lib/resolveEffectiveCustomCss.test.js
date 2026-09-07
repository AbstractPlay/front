import { describe, expect, it } from "vitest";
import {
  resolveEffectiveCustomCss,
  shouldImportLegacyCustomCss,
} from "./resolveEffectiveCustomCss.js";

describe("resolveEffectiveCustomCss", () => {
  const localMap = {
    chess: { css: "div._meta_chess {}", active: true },
  };

  it("prefers per-game account CSS over localStorage", () => {
    const result = resolveEffectiveCustomCss(
      {
        customizations: {
          chess: { customCss: { css: "account", active: true } },
        },
      },
      "chess",
      localMap
    );
    expect(result?.source).toBe("account");
    expect(result?.css).toBe("account");
  });

  it("uses _default account CSS when per-game has no customCss", () => {
    const result = resolveEffectiveCustomCss(
      {
        customizations: {
          _default: { customCss: { css: "default-css", active: true } },
        },
      },
      "go",
      { go: { css: "local", active: true } }
    );
    expect(result?.source).toBe("account");
    expect(result?.css).toBe("default-css");
  });

  it("falls back to localStorage when no account CSS", () => {
    const result = resolveEffectiveCustomCss({}, "chess", localMap);
    expect(result?.source).toBe("local");
    expect(result?.css).toBe("div._meta_chess {}");
  });

  it("returns null when nothing configured", () => {
    expect(resolveEffectiveCustomCss({}, "chess", {})).toBeNull();
  });
});

describe("shouldImportLegacyCustomCss", () => {
  const localEntry = { css: "local", active: true };

  it("imports when no account CSS exists", () => {
    expect(shouldImportLegacyCustomCss({}, "chess", localEntry)).toBe(true);
  });

  it("skips when per-game account customCss exists", () => {
    expect(
      shouldImportLegacyCustomCss(
        { customizations: { chess: { customCss: { css: "x", active: true } } } },
        "chess",
        localEntry
      )
    ).toBe(false);
  });

  it("skips when _default customCss exists", () => {
    expect(
      shouldImportLegacyCustomCss(
        { customizations: { _default: { customCss: { css: "x", active: true } } } },
        "chess",
        localEntry
      )
    ).toBe(false);
  });

  it("skips for _default scope", () => {
    expect(shouldImportLegacyCustomCss({}, "_default", localEntry)).toBe(false);
  });
});
