import ReactTimeAgo from "react-time-ago";
import { useTranslation } from "react-i18next";
import { resolveTimeAgoLocale } from "../lib/timeAgoLocales";

function LocalizedTimeAgo(props) {
  const { i18n } = useTranslation();
  const locale = resolveTimeAgoLocale(i18n.resolvedLanguage);

  return <ReactTimeAgo {...props} locale={locale} />;
}

export default LocalizedTimeAgo;
