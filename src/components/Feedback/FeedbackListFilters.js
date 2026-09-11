import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  PRIORITY_LEVELS,
  statusesForKind,
} from "../../lib/feedback/feedbackConstants";

function FeedbackListFilters({
  kind,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  sortBy,
  onSortByChange,
  showSort = false,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="field feedback-filter-field">
        <label className="label" htmlFor="feedback-filter-status">{t("feedback.admin.status")}</label>
        <select
          id="feedback-filter-status"
          className="select"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">{t("feedback.admin.allStatuses")}</option>
          {statusesForKind(kind).map((value) => (
            <option key={value} value={value}>
              {t(`feedback.status.${value}`, { defaultValue: value })}
            </option>
          ))}
        </select>
      </div>
      <div className="field feedback-filter-field">
        <label className="label" htmlFor="feedback-filter-priority">{t("feedback.admin.priority")}</label>
        <select
          id="feedback-filter-priority"
          className="select"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="">{t("feedback.admin.allPriorities")}</option>
          {PRIORITY_LEVELS.map((value) => (
            <option key={value} value={value}>
              {t(`feedback.priority.${value}`)}
            </option>
          ))}
        </select>
      </div>
      {showSort ? (
        <div className="field feedback-filter-field">
          <label className="label" htmlFor="feedback-filter-sort">{t("feedback.admin.sortBy")}</label>
          <select
            id="feedback-filter-sort"
            className="select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
          >
            <option value="default">{t("feedback.admin.sortDefault")}</option>
            <option value="priority">{t("feedback.admin.sortPriority")}</option>
            <option value="status">{t("feedback.admin.sortStatus")}</option>
          </select>
        </div>
      ) : null}
    </>
  );
}

FeedbackListFilters.propTypes = {
  kind: PropTypes.oneOf(["bug", "feature"]).isRequired,
  status: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  priority: PropTypes.string.isRequired,
  onPriorityChange: PropTypes.func.isRequired,
  sortBy: PropTypes.string,
  onSortByChange: PropTypes.func,
  showSort: PropTypes.bool,
};

export default FeedbackListFilters;
