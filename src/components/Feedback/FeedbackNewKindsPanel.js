import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  defaultFeedbackNewKinds,
  FEEDBACK_NEW_KIND_KEYS,
} from "../../lib/notificationPrefs";

function FeedbackNewKindsPanel({ kinds, onToggle, saving, disabled }) {
  const { t } = useTranslation();
  const values = defaultFeedbackNewKinds(kinds);

  return (
    <section className="feedback-notify-opt-in">
      <h2 className="title is-5">{t("feedback.mine.notifyTitle")}</h2>
      <p className="feedback-muted">{t("feedback.mine.notifyIntro")}</p>
      <p className="feedback-muted feedback-field-hint">{t("feedback.mine.notifyHint")}</p>
      {FEEDBACK_NEW_KIND_KEYS.map((kind) => (
        <div className="control" key={kind}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(values[kind])}
              disabled={disabled || saving}
              onChange={() => onToggle(kind)}
            />
            {t(`feedback.mine.notifyKind_${kind}`)}
          </label>
        </div>
      ))}
    </section>
  );
}

FeedbackNewKindsPanel.propTypes = {
  kinds: PropTypes.object,
  onToggle: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default FeedbackNewKindsPanel;
