import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import TimeAgo from "javascript-time-ago";
import {
  getTimeAgoLocaleData,
  resolveTimeAgoLocale,
} from "../lib/timeAgoLocales";

function TimeAgoLocaleSync() {
  const { i18n } = useTranslation();
  const addedLocalesRef = useRef(new Set());

  useEffect(() => {
    const code = resolveTimeAgoLocale(i18n.resolvedLanguage);
    const locale = getTimeAgoLocaleData(code);

    if (!addedLocalesRef.current.has(code)) {
      TimeAgo.addLocale(locale);
      addedLocalesRef.current.add(code);
    }

    TimeAgo.setDefaultLocale(code);
  }, [i18n.resolvedLanguage]);

  return null;
}

export default TimeAgoLocaleSync;
