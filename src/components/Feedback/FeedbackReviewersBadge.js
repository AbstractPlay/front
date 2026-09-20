import PropTypes from "prop-types";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import FeedbackPlayerLink from "./FeedbackPlayerLink";

function FeedbackReviewersBadge({ reviewers, compact = false }) {
  const { t } = useTranslation();
  if (!Array.isArray(reviewers) || reviewers.length === 0) {
    return null;
  }
  const listed = reviewers.filter((reviewer) => reviewer?.name);
  if (listed.length === 0) {
    return null;
  }
  const names = listed.map((reviewer) => reviewer.name);

  return (
    <span
      className="feedback-status-badge feedback-reviewer-badge"
      title={names.join(", ")}
    >
      {compact ? (
        t("feedback.reviewers.badgeCompact", { count: names.length })
      ) : (
        <>
          {t("feedback.reviewers.badgePrefix")}
          {listed.map((reviewer, index) => (
            <Fragment key={reviewer.id ?? reviewer.name}>
              {index > 0 ? ", " : " "}
              <FeedbackPlayerLink userId={reviewer.id} name={reviewer.name} />
            </Fragment>
          ))}
        </>
      )}
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
