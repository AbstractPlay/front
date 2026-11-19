import React, { Fragment, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signUp } from "aws-amplify/auth";
import { mapCognitoAuthError } from "../../lib/mapCognitoAuthError";
import { passwordMeetsCognitoPolicy } from "../../lib/cognitoPasswordPolicy";
import CognitoPasswordPolicyChecklist from "./CognitoPasswordPolicyChecklist";

function emailsMatchForRegister(a, b) {
  const normalize = (raw) => {
    const trimmed = raw.trim();
    const at = trimmed.lastIndexOf("@");
    if (at <= 0) {
      return trimmed.toLowerCase();
    }
    return `${trimmed.slice(0, at).trim()}@${trimmed.slice(at + 1).trim().toLowerCase()}`.toLowerCase();
  };
  return normalize(a) === normalize(b);
}

export default function AccountRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formStartedAtRef = useRef(String(Date.now()));
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordFieldActive, setPasswordFieldActive] = useState(false);

  const loginName = username.trim();
  const mail = email.trim();
  const mailConfirm = emailConfirm.trim();
  const canSubmit =
    loginName.length > 0
    && mail.length > 0
    && mailConfirm.length > 0
    && passwordMeetsCognitoPolicy(password)
    && emailsMatchForRegister(mail, mailConfirm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setErrorKey("AccountRegisterFieldsRequired");
      return;
    }
    if (!emailsMatchForRegister(mail, mailConfirm)) {
      setErrorKey("AccountRegisterEmailConfirmMismatch");
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
          clientMetadata: {
            website: honeypot.trim(),
            emailConfirm: mailConfirm,
            formStartedAt: formStartedAtRef.current,
          },
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
            <label className="label" htmlFor="account_register_email_confirm">
              {t("AccountRegisterEmailConfirmLabel")}
            </label>
            <div className="control">
              <input
                id="account_register_email_confirm"
                className="input"
                type="email"
                value={emailConfirm}
                onChange={(e) => setEmailConfirm(e.target.value)}
                autoComplete="off"
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
                onFocus={() => setPasswordFieldActive(true)}
                autoComplete="new-password"
                disabled={busy}
                aria-describedby="account_register_password_policy"
              />
            </div>
            <h2 id="account_register_password_policy" className="is-sr-only">
              {t("AccountPasswordPolicyLegend")}
            </h2>
            <CognitoPasswordPolicyChecklist
              password={password}
              active={passwordFieldActive}
            />
          </div>
          <input
            id="account_register_website"
            name="website"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="account-register-honeypot"
          />
          <div className="field">
            <button
              type="submit"
              className="button apButton"
              disabled={busy || !canSubmit}
            >
              {busy ? t("AccountRegisterSubmitting") : t("AccountPageRegister")}
            </button>
          </div>
        </form>
        <div className="account-page-footer">
          <p>
            {t("AccountRegisterHaveAccount")}{" "}
            <Link to="/account/login">{t("AccountPageLogin")}</Link>
          </p>
          <p>
            <Link to="/">{t("AccountBackHome")}</Link>
          </p>
        </div>
      </div>
    </Fragment>
  );
}