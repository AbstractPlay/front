import PropTypes from "prop-types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import LocalizedTimeAgo from "../LocalizedTimeAgo";

function FeedbackTimestamp({ date, className }) {
  const { i18n } = useTranslation();
  const timestamp = Number(date);
  const title = useMemo(() => {
    if (!timestamp || Number.isNaN(timestamp)) {
      return undefined;
    }
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(timestamp);
  }, [i18n.language, timestamp]);

  if (!timestamp || Number.isNaN(timestamp)) {
    return null;
  }

  return (
    <time
      className={className ?? "feedback-timestamp"}
      dateTime={new Date(timestamp).toISOString()}
      title={title}
    >
      <LocalizedTimeAgo date={timestamp} timeStyle="twitter-now" />
    </time>
  );
}

FeedbackTimestamp.propTypes = {
  date: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  className: PropTypes.string,
};

export default FeedbackTimestamp;
