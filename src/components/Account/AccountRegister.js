import React, { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signUp } from "aws-amplify/auth";
import { mapCognitoAuthError } from "../../lib/mapCognitoAuthError";

export default function AccountRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loginName = username.trim();
    const mail = email.trim();
    if (!loginName || !mail || !password) {
      setErrorKey("AccountRegisterFieldsRequired");
      return;
    }
    setBusy(true);
    setErrorKey("");
    try {
      await signUp({
        username: loginName,
        password,
        options: {
          userAttributes: { email: mail },
          autoSignIn: true,
        },
      });
      navigate(
        `/account/verify?username=${encodeURIComponent(loginName)}&pending=1`,
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
      <div className="content account-register">
        <h1 className="title is-4">{t("AccountPageRegister")}</h1>
        {errorKey ? (
          <p className="help is-danger" role="alert">
            {t(errorKey)}
          </p>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="account_register_username">
              {t("LoginNameLabel")}
            </label>
            <div className="control">
              <input
                id="account_register_username"
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                disabled={busy}
              />
            </div>
            <p className="help">{t("AccountRegisterUsernameHint")}</p>
          </div>
          <div className="field">
            <label className="label" htmlFor="account_register_email">
              {t("EMail")}
            </label>
            <div className="control">
              <input
                id="account_register_email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={busy}
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="account_register_password">
              {t("AccountLoginPassword")}
            </label>
            <div className="control">
              <input
                id="account_register_password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
            <p className="help">{t("AccountRegisterPasswordHint")}</p>
          </div>
          <div className="field">
            <button
              type="submit"
              className="button apButton"
              disabled={busy}
            >
              {busy ? t("AccountRegisterSubmitting") : t("AccountPageRegister")}
            </button>
          </div>
        </form>
        <p>
          {t("AccountRegisterHaveAccount")}{" "}
          <Link to="/account/login">{t("AccountPageLogin")}</Link>
        </p>
        <p>
          <Link to="/">{t("AccountBackHome")}</Link>
        </p>
      </div>
    </Fragment>
  );
}