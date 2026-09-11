import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { redirectToSignIn } from "../../lib/amplifyAuth";

function FeedbackSignInRequired({ messageKey = "feedback.auth.signInRequired", compact = false }) {
  const { t } = useTranslation();

  return (
    <div className={compact ? "feedback-sign-in-required feedback-sign-in-required--compact" : "feedback-sign-in-required"}>
      <p className={compact ? "feedback-muted" : undefined}>{t(messageKey)}</p>
      <button type="button" className={`button ${compact ? "is-small apButton" : "apButton"}`} onClick={() => redirectToSignIn()}>
        {t("LogIn")}
      </button>
    </div>
  );
}

FeedbackSignInRequired.propTypes = {
  messageKey: PropTypes.string,
  compact: PropTypes.bool,
};

export default FeedbackSignInRequired;
