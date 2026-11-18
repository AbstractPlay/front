import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "../../hooks/useAuthSession";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signIn } from "aws-amplify/auth";
import { mapCognitoAuthError } from "../../lib/mapCognitoAuthError";
import { refreshAuthSession } from "../../lib/authSession";
import { fetchProfile } from "../../lib/globalMeBootstrap";
import { readReturnUrlFromSearch, safeReturnUrl } from "../../lib/safeReturnUrl";

export default function AccountLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnPath = useMemo(() => {
    const raw = readReturnUrlFromSearch(searchParams.toString());
    return safeReturnUrl(raw ?? "/", "/");
  }, [searchParams]);

  const { status } = useAuthSession();
  const [username, setUsername] = useState(
    () => searchParams.get("username")?.trim() ?? "",
  );
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "ready") {
      navigate(returnPath, { replace: true });
    }
  }, [status, returnPath, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loginName = username.trim();
    if (!loginName || !password) {
      setErrorKey("AccountLoginFieldsRequired");
      return;
    }
    setBusy(true);
    setErrorKey("");
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: loginName,
        password,
      });
      if (!isSignedIn && nextStep?.signInStep && nextStep.signInStep !== "DONE") {
        setErrorKey("CognitoError_Generic");
        return;
      }
      localStorage.setItem("wasLoggedIn", "1");
      sessionStorage.removeItem("intentionalLogout");
      await refreshAuthSession();
      await fetchProfile();
      navigate(returnPath, { replace: true });
    } catch (error) {
      const name =
        error && typeof error === "object" ? error.name ?? error.code : "";
      if (name === "UserNotConfirmedException") {
        navigate(
          `/account/verify?username=${encodeURIComponent(loginName)}`,
          { replace: true },
        );
        return;
      }
      setErrorKey(mapCognitoAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Fragment>
      <div className="content account-login">
        <h1 className="title is-4">{t("AccountPageLogin")}</h1>
        {searchParams.get("verified") === "1" ? (
          <p className="notification is-success is-light">
            {t("AccountLoginVerifiedNowSignIn")}
          </p>
        ) : null}
        <p className="help account-login-hint">{t("AccountLoginNameHelp")}</p>
        {errorKey ? (
          <p className="help is-danger" role="alert">
            {t(errorKey)}
          </p>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="account_login_username">
              {t("LoginNameLabel")}
            </label>
            <div className="control">
              <input
                id="account_login_username"
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
          </div>
          <div className="field">
            <label className="label" htmlFor="account_login_password">
              {t("AccountLoginPassword")}
            </label>
            <div className="control">
              <input
                id="account_login_password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
              />
            </div>
          </div>
          <div className="field is-grouped">
            <div className="control">
              <button
                type="submit"
                className="button apButton"
                disabled={busy}
              >
                {busy ? t("AccountLoginSubmitting") : t("LogIn")}
              </button>
            </div>
          </div>
        </form>
        <div className="account-page-footer">
          <p className="account-login-links">
            <Link to="/account/register">{t("AccountPageRegister")}</Link>
            {" · "}
            <Link to="/account/forgot-password">{t("AccountPageForgotPassword")}</Link>
            {" · "}
            <Link to="/account/forgot-username">{t("AccountPageForgotUsername")}</Link>
          </p>
          <p>
            <Link to="/">{t("AccountBackHome")}</Link>
          </p>
        </div>
      </div>
    </Fragment>
  );
}