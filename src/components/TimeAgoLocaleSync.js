import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import fr from "javascript-time-ago/locale/fr.json";
import de from "javascript-time-ago/locale/de.json";
import it from "javascript-time-ago/locale/it.json";

const TIME_AGO_LOCALES = { en, fr, de, it };

function resolveTimeAgoLocale(language) {
  const code = (language || "en").split("-")[0];
  return TIME_AGO_LOCALES[code] ? code : "en";
}

function TimeAgoLocaleSync() {
  const { i18n } = useTranslation();
  const addedLocalesRef = useRef(new Set());

  useEffect(() => {
    const code = resolveTimeAgoLocale(i18n.resolvedLanguage);
    const locale = TIME_AGO_LOCALES[code];

    if (!addedLocalesRef.current.has(code)) {
      TimeAgo.addLocale(locale);
      addedLocalesRef.current.add(code);
    }

    TimeAgo.setDefaultLocale(code);
  }, [i18n.resolvedLanguage]);

  return null;
}

export default TimeAgoLocaleSync;
