import PropTypes from "prop-types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatUserDisplayName } from "../Bots/botUtils";
import { FEEDBACK_REVIEWER_MAX_COUNT } from "../../lib/feedback/feedbackConstants";
import { groupUsersForReviewerPicker } from "../../lib/feedback/feedbackReviewerUsers";

function FeedbackReviewerPicker({ users, selectedIds, onChange, disabled = false }) {
  const { t, i18n } = useTranslation();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedUsers = useMemo(
    () => selectedIds
      .map((id) => users.find((user) => user.id === id))
      .filter(Boolean),
    [selectedIds, users],
  );
  const { priority: priorityUsers, others: otherUsers } = useMemo(
    () => groupUsersForReviewerPicker(
      users.filter((user) => !selectedSet.has(user.id)),
      { language: i18n.language },
    ),
    [users, selectedSet, i18n.language],
  );
  const hasPriorityUsers = priorityUsers.length > 0;
  const hasOtherUsers = otherUsers.length > 0;
  const hasAvailableUsers = hasPriorityUsers || hasOtherUsers;

  function handleAdd(id) {
    if (!id || selectedSet.has(id) || selectedIds.length >= FEEDBACK_REVIEWER_MAX_COUNT) {
      return;
    }
    onChange([...selectedIds, id]);
  }

  function handleRemove(id) {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  }

  return (
    <div className="feedback-reviewer-picker">
      {selectedUsers.length > 0 ? (
        <ul className="feedback-reviewer-selected">
          {selectedUsers.map((user) => (
            <li key={user.id}>
              <span className="feedback-reviewer-chip">
                {formatUserDisplayName(user, users)}
                <button
                  type="button"
                  className="feedback-reviewer-remove"
                  onClick={() => handleRemove(user.id)}
                  disabled={disabled}
                  aria-label={t("feedback.reviewers.remove", {
                    name: formatUserDisplayName(user, users),
                  })}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="feedback-muted feedback-field-hint">{t("feedback.reviewers.empty")}</p>
      )}
      {selectedIds.length < FEEDBACK_REVIEWER_MAX_COUNT ? (
        <div className="select is-small">
          <select
            value=""
            onChange={(e) => handleAdd(e.target.value)}
            disabled={disabled || !hasAvailableUsers}
            aria-label={t("feedback.reviewers.add")}
          >
            <option value="">{t("feedback.reviewers.add")}</option>
            {priorityUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {formatUserDisplayName(user, users)}
              </option>
            ))}
            {hasPriorityUsers && hasOtherUsers ? (
              <option disabled className="feedback-reviewer-divider">
                {t("feedback.reviewers.divider")}
              </option>
            ) : null}
            {otherUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {formatUserDisplayName(user, users)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p className="feedback-muted feedback-field-hint">
        {t("feedback.reviewers.hint", { max: FEEDBACK_REVIEWER_MAX_COUNT })}
      </p>
    </div>
  );
}

FeedbackReviewerPicker.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    admin: PropTypes.bool,
    bot: PropTypes.bool,
  })).isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default FeedbackReviewerPicker;
