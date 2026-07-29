import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { addResource } from "@abstractplay/gameslib";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];

const HTTP_NAMESPACES = ["apfront", "apgames", "apresults"];

const ensureGamesLibResources = () => {
  const gamesLibI18n = addResource(i18n.language, i18n);
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
    ns: HTTP_NAMESPACES,
    defaultNS: "apfront",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    debug: process.env.NODE_ENV !== "production",
    partialBundledLanguages: false,
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
  if (!HTTP_NAMESPACES.includes(ns)) {
    return;
  }
  console.warn(`i18n: failed to load ${lng}/${ns}, falling back to en`);
  if (lng !== "en" && !i18n.hasResourceBundle("en", ns)) {
    console.error(`i18n: fallback missing for ${ns}`);
    return;
  }
  if (lng !== "en" && i18n.language === lng) {
    i18n.changeLanguage("en");
  }
});

export default i18n;
