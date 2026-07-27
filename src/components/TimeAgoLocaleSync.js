import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import fr from "javascript-time-ago/locale/fr.json";
import de from "javascript-time-ago/locale/de.json";
import it from "javascript-time-ago/locale/it.json";

const TIME_AGO_LOCALES = { en, fr, de, it };

function TimeAgoLocaleSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const locale =
      TIME_AGO_LOCALES[i18n.resolvedLanguage] || TIME_AGO_LOCALES.en;
    TimeAgo.addDefaultLocale(locale);
  }, [i18n.resolvedLanguage]);

  return null;
}

export default TimeAgoLocaleSync;
