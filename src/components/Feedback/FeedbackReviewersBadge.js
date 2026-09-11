import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

function FeedbackReviewersBadge({ reviewers, compact = false }) {
  const { t } = useTranslation();
  if (!Array.isArray(reviewers) || reviewers.length === 0) {
    return null;
  }
  const names = reviewers
    .map((reviewer) => reviewer?.name)
    .filter(Boolean);
  if (names.length === 0) {
    return null;
  }
  const label = compact
    ? t("feedback.reviewers.badgeCompact", { count: names.length })
    : t("feedback.reviewers.badge", { names: names.join(", ") });

  return (
    <span
      className="feedback-status-badge feedback-reviewer-badge"
      title={names.join(", ")}
    >
      {label}
    </span>
  );
}

FeedbackReviewersBadge.propTypes = {
  reviewers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  })),
  compact: PropTypes.bool,
};

export default FeedbackReviewersBadge;
