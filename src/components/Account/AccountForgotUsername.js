import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { postPublicQuery } from "../../lib/postPublicQuery";

export default function AccountForgotUsername() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const mail = email.trim();
    if (!mail) {
      setErrorKey("AccountForgotUsernameEmailRequired");
      return;
    }
    setBusy(true);
    setErrorKey("");
    try {
      await postPublicQuery("remind_username", { email: mail });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Fragment>
      <div className="content account-forgot-username">
        <h1 className="title is-4">{t("AccountPageForgotUsername")}</h1>
        <p className="help">{t("AccountForgotUsernameIntro")}</p>
        {done ? (
          <p className="notification is-success is-light">
            {t("AccountForgotUsernameSuccess")}
          </p>
        ) : null}
        {errorKey ? (
          <p className="help is-danger" role="alert">
            {t(errorKey)}
          </p>
        ) : null}
        {!done ? (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="account_forgot_username_email">
                {t("EMail")}
              </label>
              <div className="control">
                <input
                  id="account_forgot_username_email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={busy}
                />
              </div>
            </div>
            <button type="submit" className="button apButton" disabled={busy}>
              {busy ? t("AccountForgotUsernameSubmitting") : t("Submit")}
            </button>
          </form>
        ) : null}
        <p>
          <Link to="/account/login">{t("AccountPageLogin")}</Link>
          {" · "}
          <Link to="/">{t("AccountBackHome")}</Link>
        </p>
      </div>
    </Fragment>
  );
}