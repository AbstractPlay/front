import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  effortLabelKey,
  priorityLabelKey,
  PRIORITY_LEVELS,
  statusLabelKey,
  wishlistCategoryLabelKey,
} from "../../lib/feedback/feedbackConstants";

function FeedbackStatusBadge({ status, effort, priority, wishlistCategory }) {
  const { t } = useTranslation();
  const label = t(statusLabelKey(status), { defaultValue: status });
  const effortLabel = effort
    ? t(effortLabelKey(effort), { defaultValue: effort })
    : null;
  const priorityLabel = PRIORITY_LEVELS.includes(priority)
    ? t(priorityLabelKey(priority))
    : null;
  const categoryLabel = wishlistCategory && wishlistCategory !== "none"
    ? t(wishlistCategoryLabelKey(wishlistCategory))
    : null;
  const categoryClass = wishlistCategory === "permissions_required"
    ? "feedback-status-badge feedback-wishlist-category-badge permissions"
    : wishlistCategory === "declined"
      ? "feedback-status-badge feedback-wishlist-category-badge declined"
      : "feedback-status-badge feedback-wishlist-category-badge";

  return (
    <span className="feedback-status-badge-group">
      {categoryLabel ? (
        <span className={categoryClass}>{categoryLabel}</span>
      ) : (
        <span className="feedback-status-badge">{label}</span>
      )}
      {priorityLabel ? (
        <span className="feedback-status-badge feedback-priority-badge">{priorityLabel}</span>
      ) : null}
      {effortLabel ? (
        <span className="feedback-status-badge feedback-effort-badge">{effortLabel}</span>
      ) : null}
    </span>
  );
}

FeedbackStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  effort: PropTypes.string,
  priority: PropTypes.string,
  wishlistCategory: PropTypes.string,
};

export default FeedbackStatusBadge;
