import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { buildAccountLoginPath } from "../../lib/accountLoginNavigation";

function FeedbackSignInRequired({ messageKey = "feedback.auth.signInRequired", compact = false }) {
  const { t } = useTranslation();
  const location = useLocation();
  const loginPath = buildAccountLoginPath(
    `${location.pathname}${location.search}${location.hash}`,
  );

  return (
    <div className={compact ? "feedback-sign-in-required feedback-sign-in-required--compact" : "feedback-sign-in-required"}>
      <p className={compact ? "feedback-muted" : undefined}>{t(messageKey)}</p>
      <p className={compact ? "feedback-muted" : undefined}>{t("AccountLoginNameHelp")}</p>
      <Link
        to={loginPath}
        className={`button ${compact ? "is-small apButton" : "apButton"}`}
      >
        {t("LogIn")}
      </Link>
    </div>
  );
}

FeedbackSignInRequired.propTypes = {
  messageKey: PropTypes.string,
  compact: PropTypes.bool,
};

export default FeedbackSignInRequired;
