import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { feedbackTagDescription, feedbackTagLabel } from "../../lib/feedback/feedbackTagI18n";

function FeedbackTagBadges({ tags = [], compact = false }) {
  const { t } = useTranslation();
  if (!Array.isArray(tags) || tags.length === 0) {
    return null;
  }
  return (
    <span className={`feedback-tag-badges${compact ? " feedback-tag-badges-compact" : ""}`}>
      {tags.map((tagId) => {
        const description = feedbackTagDescription(t, tagId);
        return (
          <span
            key={tagId}
            className="feedback-tag-badge"
            title={description}
          >
            {feedbackTagLabel(t, tagId)}
          </span>
        );
      })}
    </span>
  );
}

FeedbackTagBadges.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string),
  compact: PropTypes.bool,
};

export default FeedbackTagBadges;
