import React, { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resetPassword } from "aws-amplify/auth";
import { mapCognitoAuthError } from "../../lib/mapCognitoAuthError";

export default function AccountForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loginName = username.trim();
    if (!loginName) {
      setErrorKey("AccountForgotPasswordUsernameRequired");
      return;
    }
    setBusy(true);
    setErrorKey("");
    try {
      await resetPassword({ username: loginName });
      navigate(
        `/account/reset-password?username=${encodeURIComponent(loginName)}&pending=1`,
        { replace: true },
      );
    } catch (error) {
      setErrorKey(mapCognitoAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Fragment>
      <div className="content account-forgot-password">
        <h1 className="title is-4">{t("AccountPageForgotPassword")}</h1>
        <p className="help">{t("AccountForgotPasswordIntro")}</p>
        {errorKey ? (
          <p className="help is-danger" role="alert">
            {t(errorKey)}
          </p>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="account_forgot_password_username">
              {t("LoginNameLabel")}
            </label>
            <div className="control">
              <input
                id="account_forgot_password_username"
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={busy}
              />
            </div>
          </div>
          <button type="submit" className="button apButton" disabled={busy}>
            {busy ? t("AccountForgotPasswordSubmitting") : t("Submit")}
          </button>
        </form>
        <p>
          <Link to="/account/login">{t("AccountPageLogin")}</Link>
          {" · "}
          <Link to="/">{t("AccountBackHome")}</Link>
        </p>
      </div>
    </Fragment>
  );
}