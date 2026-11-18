import React, { Fragment, useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resendSignUpCode } from "aws-amplify/auth";
import AccountConfirmCode from "./AccountConfirmCode";
import { completeSignUpConfirmation } from "../../lib/accountSignUpConfirm";
import { mapCognitoAuthError } from "../../lib/mapCognitoAuthError";
import { refreshAuthSession } from "../../lib/authSession";
import { fetchProfile } from "../../lib/globalMeBootstrap";
import { readReturnUrlFromSearch, safeReturnUrl } from "../../lib/safeReturnUrl";
import { useStore } from "../../stores";

const RESEND_COOLDOWN_SEC = 60;

export default function AccountVerify() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const username = useMemo(
    () => searchParams.get("username")?.trim() ?? "",
    [searchParams],
  );
  const pendingOnly = searchParams.get("pending") === "1";
  const returnPath = useMemo(() => {
    const raw = readReturnUrlFromSearch(searchParams.toString());
    return safeReturnUrl(raw ?? "/", "/");
  }, [searchParams]);

  const [resendBusy, setResendBusy] = useState(false);
  const [resendErrorKey, setResendErrorKey] = useState("");
  const [resendNoticeKey, setResendNoticeKey] = useState("");
  const [cooldownSec, setCooldownSec] = useState(0);

  const startCooldown = useCallback(() => {
    setCooldownSec(RESEND_COOLDOWN_SEC);
    const interval = window.setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const finishVerified = useCallback(async (loginName) => {
    localStorage.setItem("wasLoggedIn", "1");
    sessionStorage.removeItem("intentionalLogout");
    await refreshAuthSession();
    const session = useStore.getState().authSession;
    if (session.status !== "ready") {
      navigate(
        `/account/login?username=${encodeURIComponent(loginName)}&verified=1`,
        { replace: true },
      );
      return;
    }
    await fetchProfile();
    navigate(returnPath, { replace: true });
  }, [navigate, returnPath]);

  const runConfirm = useCallback(
    async ({ username: confirmUser, code }) => {
      const loginName = (confirmUser ?? username).trim();
      if (!loginName) {
        throw new Error("username required");
      }
      await completeSignUpConfirmation({ username: loginName, code });
      await finishVerified(loginName);
    },
    [username, finishVerified],
  );

  const handleResend = async () => {
    const loginName = username.trim();
    if (!loginName || cooldownSec > 0) {
      return;
    }
    setResendBusy(true);
    setResendErrorKey("");
    setResendNoticeKey("");
    try {
      await resendSignUpCode({ username: loginName });
      setResendNoticeKey("AccountVerifyResendSent");
      startCooldown();
    } catch (error) {
      setResendErrorKey(mapCognitoAuthError(error));
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <Fragment>
      <div className="content account-verify">
        <h1 className="title is-4">{t("AccountPageVerify")}</h1>
        {username ? (
          <p className="help">
            {t("AccountVerifyForUser", { username })}
          </p>
        ) : null}
        {pendingOnly && !searchParams.get("code") ? (
          <p className="notification is-info is-light">
            {t("AccountVerifyCheckEmail")}
          </p>
        ) : null}
        {resendNoticeKey ? (
          <p className="help is-success">{t(resendNoticeKey)}</p>
        ) : null}
        {resendErrorKey ? (
          <p className="help is-danger">{t(resendErrorKey)}</p>
        ) : null}
        <AccountConfirmCode
          requireUsername={!username}
          onAutoConfirm={runConfirm}
          onManualConfirm={runConfirm}
        />
        {username ? (
          <p className="account-verify-resend">
            <button
              type="button"
              className="button is-small"
              onClick={handleResend}
              disabled={resendBusy || cooldownSec > 0}
            >
              {cooldownSec > 0
                ? t("AccountVerifyResendWait", { seconds: cooldownSec })
                : t("AccountVerifyResend")}
            </button>
          </p>
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