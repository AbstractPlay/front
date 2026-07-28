import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { addResource } from "@abstractplay/gameslib";
import en from "./locales/en/apfront.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];

// Only apfront is loaded via HTTP; apgames/apresults come from gameslib bundles.
const HTTP_NAMESPACE = "apfront";

const ensureGamesLibResources = () => {
  // Do not pass the host i18n instance: gameslib's chatLog() uses its own i18next
  // import, which can be a separate object in the webpack bundle. Passing the host
  // caused addResource to skip gameslib's fallback init, so t() returned undefined.
  const gamesLibI18n = addResource(i18n.language);
  if (gamesLibI18n.language !== i18n.language) {
    void gamesLibI18n.changeLanguage(i18n.language);
  }
};

i18n.on("initialized", ensureGamesLibResources);
i18n.on("languageChanged", ensureGamesLibResources);

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    ns: [HTTP_NAMESPACE],
    defaultNS: HTTP_NAMESPACE,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    debug: process.env.NODE_ENV !== "production",
    partialBundledLanguages: true,
    resources: {
      en: { apfront: en },
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    keySeparator: ".", // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })
  .then(ensureGamesLibResources)
  .catch((err) => {
    console.error("i18n init failed:", err);
  });

i18n.on("failedLoading", (lng, ns) => {
  if (ns !== HTTP_NAMESPACE) {
    return;
  }
  console.warn(`i18n: failed to load ${lng}/${ns}, falling back to en`);
  if (lng !== "en" && !i18n.hasResourceBundle("en", ns)) {
    console.error(`i18n: bundled fallback missing for ${ns}`);
    return;
  }
  if (lng !== "en" && i18n.language === lng) {
    i18n.changeLanguage("en");
  }
});

export default i18n;
