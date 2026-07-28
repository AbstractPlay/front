import ReactTimeAgo from "react-time-ago";
import { useTranslation } from "react-i18next";

function resolveTimeAgoLocale(language) {
  return (language || "en").split("-")[0];
}

function LocalizedTimeAgo(props) {
  const { i18n } = useTranslation();
  const locale = resolveTimeAgoLocale(i18n.resolvedLanguage);

  return <ReactTimeAgo {...props} locale={locale} />;
}

export default LocalizedTimeAgo;
