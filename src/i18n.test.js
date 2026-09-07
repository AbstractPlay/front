import { describe, expect, it } from "vitest";
import { getUiLocaleBundleKey, gamesLibLocale, normalizeUiLanguage } from "./i18n";

describe("normalizeUiLanguage", () => {
  it("keeps Esperanto as eo", () => {
    expect(normalizeUiLanguage("eo")).toBe("eo");
  });
});

describe("gamesLibLocale", () => {
  it("maps Esperanto to eo, not English fallback", () => {
    expect(gamesLibLocale("eo")).toBe("eo");
  });

  it("maps Spanish UI code to es-US", () => {
    expect(gamesLibLocale("es")).toBe("es-US");
  });
});

describe("getUiLocaleBundleKey", () => {
  it("changes when namespaces finish loading", () => {
    const bundles = { apfront: false, apgames: false, apresults: false };
    const i18n = {
      language: "eo",
      resolvedLanguage: "eo",
      hasResourceBundle: (_lang, ns) => bundles[ns],
    };

    expect(getUiLocaleBundleKey(i18n)).toBe("eo:000");

    bundles.apfront = true;
    expect(getUiLocaleBundleKey(i18n)).toBe("eo:100");

    bundles.apgames = true;
    bundles.apresults = true;
    expect(getUiLocaleBundleKey(i18n)).toBe("eo:111");
  });
});
