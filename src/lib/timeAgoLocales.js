import { SUPPORTED_LANGUAGES, normalizeUiLanguage } from "../i18n";
import { TIME_AGO_LOCALE_DATA_BY_FILE } from "./timeAgoLocaleData";

/** UI locale code → javascript-time-ago locale data for supported languages. */
export const TIME_AGO_LOCALES = Object.fromEntries(
  SUPPORTED_LANGUAGES.map(({ code, timeAgoCode = code }) => {
    const data = TIME_AGO_LOCALE_DATA_BY_FILE[timeAgoCode];
    return data ? [code, data] : null;
  }).filter(Boolean)
);

export function resolveTimeAgoLocale(language) {
  const code = normalizeUiLanguage(language);
  if (TIME_AGO_LOCALES[code]) {
    return code;
  }
  return "en";
}

export function getTimeAgoLocaleData(code) {
  return TIME_AGO_LOCALES[code] ?? TIME_AGO_LOCALES.en;
}
