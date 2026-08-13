import { REAL_MODE } from "./lib/realMode";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  addResource,
  i18n as gamesLibI18n,
  resolveLocale,
} from "@abstractplay/gameslib";
import enApfront from "./locales/en/apfront.json";
import enApgames from "./locales/en/apgames.json";
import enApresults from "./locales/en/apresults.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
];

/** Backend email/push locales (apback); may exceed UI footer languages. */
export const COMMUNICATION_LANGUAGES = [
  ...SUPPORTED_LANGUAGES,
  { code: "pt", label: "Português" },
  { code: "ta", label: "தமிழ்" },
];

const HTTP_NAMESPACES = ["apfront", "apgames", "apresults"];
const GAMESLIB_NAMESPACES = ["apgames", "apresults"];
const SPANISH_LOCALE_FOLDER = "es-US";
const SUPPORTED_LANGUAGE_CODES = new Set(
  SUPPORTED_LANGUAGES.map((language) => language.code)
);

/** Published S3 folder for Spanish bundles (es-US), while i18n language code is es. */
function localeFolder(language) {
  const lower = String(language ?? "").toLowerCase();
  if (lower === "es" || lower.startsWith("es-")) {
    return SPANISH_LOCALE_FOLDER;
  }
  return language;
}

/** Map es / es-* tags to supported UI locale code es. */
function mapSpanishLocale(language) {
  const lower = String(language ?? "").toLowerCase();
  if (lower === "es" || lower.startsWith("es-")) {
    return "es";
  }
  return null;
}

/** Map detector/localStorage tags to a supported UI locale (es-* → es). */
export function normalizeUiLanguage(language) {
  if (!language) {
    return "en";
  }
  if (SUPPORTED_LANGUAGE_CODES.has(language)) {
    return language;
  }
  const spanish = mapSpanishLocale(language);
  if (spanish) {
    return spanish;
  }
  const base = String(language).toLowerCase().split("-")[0];
  for (const code of SUPPORTED_LANGUAGE_CODES) {
    if (code.toLowerCase() === base) {
      return code;
    }
  }
  return "en";
}

function convertDetectedLanguage(language) {
  const normalized = normalizeUiLanguage(language);
  if (normalized !== "en" || String(language ?? "").toLowerCase().startsWith("en")) {
    return normalized;
  }
  // Preserve regional tags (fr-CA, de-AT) for nonExplicitSupportedLngs matching.
  return language;
}

/** Language code for the footer picker while HTTP bundles are loading. */
export function getPickerLanguage(i18nInstance) {
  return normalizeUiLanguage(
    i18nInstance.language ?? i18nInstance.resolvedLanguage ?? "en"
  );
}

/** Copy host bundles into gameslib (host "es" → gameslib "es-US"). */
const syncGamesLibBundles = () => {
  if (!gamesLibI18n?.isInitialized || !i18n.isInitialized) {
    return;
  }
  const hostLang = normalizeUiLanguage(i18n.language);
  const gamesLibLang = resolveLocale(hostLang);
  for (const ns of GAMESLIB_NAMESPACES) {
    const bundle = i18n.getResourceBundle(hostLang, ns);
    if (bundle) {
      gamesLibI18n.addResourceBundle(gamesLibLang, ns, bundle, true, true);
    }
  }
  if (gamesLibI18n.language !== gamesLibLang) {
    void gamesLibI18n.changeLanguage(gamesLibLang);
  }
};

const ensureGamesLibResources = () => {
  const uiLanguage = normalizeUiLanguage(i18n.language);
  if (i18n.language !== uiLanguage) {
    void i18n.changeLanguage(uiLanguage);
    return;
  }
  addResource(i18n.language, i18n);
  syncGamesLibBundles();
};

const onHostGamesNamespaceUpdated = (_lng, ns) => {
  if (GAMESLIB_NAMESPACES.includes(ns)) {
    ensureGamesLibResources();
  }
};

i18n.on("initialized", ensureGamesLibResources);
i18n.on("languageChanged", ensureGamesLibResources);
i18n.on("loaded", onHostGamesNamespaceUpdated);
i18n.on("added", onHostGamesNamespaceUpdated);

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    ns: HTTP_NAMESPACES,
    defaultNS: "apfront",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    // Regional Spanish files live under /locales/es-US/; i18n language code is es.
    load: "languageOnly",
    debug: REAL_MODE !== "production",
    partialBundledLanguages: true,
    resources: {
      en: {
        apfront: enApfront,
        apgames: enApgames,
        apresults: enApresults,
      },
    },
    backend: {
      loadPath: (languages, namespaces) =>
        `/locales/${localeFolder(languages[0])}/${namespaces[0]}.json`,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      convertDetectedLanguage,
    },

    keySeparator: ".", // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: true,
      bindI18n: "languageChanged",
      bindI18nStore: "added loaded",
    },
  })
  .then(ensureGamesLibResources)
  .catch((err) => {
    console.error("i18n init failed:", err);
  });

i18n.on("failedLoading", (lng, ns, msg) => {
  if (!HTTP_NAMESPACES.includes(ns)) {
    return;
  }
  console.warn(
    `i18n: failed to load ${lng}/${ns}${msg ? `: ${msg}` : ""}, using fallback`
  );
  // UI strings live in apfront; missing game namespaces should not revert the UI.
  if (ns !== "apfront") {
    return;
  }
  if (lng !== "en" && !i18n.hasResourceBundle("en", ns)) {
    console.error(`i18n: bundled fallback missing for ${ns}`);
    return;
  }
  if (lng !== "en" && i18n.language === lng) {
    i18n.changeLanguage("en");
  }
});

export default i18n;
