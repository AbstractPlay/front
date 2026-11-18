import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { confirmResetPassword, signIn } from "aws-amplify/auth";
import { mapCognitoAuthError } from "../../lib/mapCognitoAuthError";
import { parseAccountConfirmQuery } from "../../lib/accountQueryParams";
import { refreshAuthSession } from "../../lib/authSession";
import { fetchProfile } from "../../lib/globalMeBootstrap";
import { readReturnUrlFromSearch, safeReturnUrl } from "../../lib/safeReturnUrl";
import { buildAccountLoginPath } from "../../lib/accountLoginNavigation";

export default function AccountResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = useMemo(
    () => parseAccountConfirmQuery(searchParams),
    [searchParams],
  );
  const pendingOnly = searchParams.get("pending") === "1";
  const returnPath = useMemo(() => {
    const raw = readReturnUrlFromSearch(searchParams.toString());
    return safeReturnUrl(raw ?? "/", "/");
  }, [searchParams]);

  const [username, setUsername] = useState(query.username ?? "");
  const [code, setCode] = useState(query.code ?? "");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUsername(query.username ?? "");
    setCode(query.code ?? "");
  }, [query.username, query.code]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loginName = username.trim();
    const resetCode = code.trim();
    if (!loginName || !resetCode || !password) {
      setErrorKey("AccountResetPasswordFieldsRequired");
      return;
    }
    setBusy(true);
    setErrorKey("");
    try {
      await confirmResetPassword({
        username: loginName,
        confirmationCode: resetCode,
        newPassword: password,
      });
      try {
        await signIn({ username: loginName, password });
        localStorage.setItem("wasLoggedIn", "1");
        sessionStorage.removeItem("intentionalLogout");
        await refreshAuthSession();
        await fetchProfile();
        navigate(returnPath, { replace: true });
      } catch {
        navigate(buildAccountLoginPath(returnPath), { replace: true });
      }
    } catch (error) {
      setErrorKey(mapCognitoAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Fragment>
      <div className="content account-reset-password">
        <h1 className="title is-4">{t("AccountPageResetPassword")}</h1>
        {pendingOnly && !query.code ? (
          <p className="notification is-info is-light">
            {t("AccountResetPasswordCheckEmail")}
          </p>
        ) : null}
        <p className="help">{t("AccountResetPasswordIntro")}</p>
        {errorKey ? (
          <p className="help is-danger" role="alert">
            {t(errorKey)}
          </p>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="account_reset_username">
              {t("LoginNameLabel")}
            </label>
            <div className="control">
              <input
                id="account_reset_username"
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={busy}
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="account_reset_code">
              {t("EMailCode")}
            </label>
            <div className="control">
              <input
                id="account_reset_code"
                className="input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                disabled={busy}
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="account_reset_password">
              {t("AccountResetPasswordNew")}
            </label>
            <div className="control">
              <input
                id="account_reset_password"
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
          <button type="submit" className="button apButton" disabled={busy}>
            {busy ? t("AccountResetPasswordSubmitting") : t("AccountPageResetPassword")}
          </button>
        </form>
        <div className="account-page-footer">
          <p>
            <Link to="/account/login">{t("AccountPageLogin")}</Link>
            {" · "}
            <Link to="/">{t("AccountBackHome")}</Link>
          </p>
        </div>
      </div>
    </Fragment>
  );
}