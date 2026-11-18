import React, { Fragment, useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AccountConfirmCode from "./AccountConfirmCode";
import { confirmEmailAttributeCode } from "../../lib/accountConfirmEmailAttribute";
import { buildAccountLoginPath } from "../../lib/accountLoginNavigation";
import { readReturnUrlFromSearch, safeReturnUrl } from "../../lib/safeReturnUrl";
import { userSettingsProfileReturnPath } from "../../lib/userSettingsDeepLink";
import { useAuthSession } from "../../hooks/useAuthSession";

export default function AccountConfirmEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status } = useAuthSession();

  const returnPath = useMemo(() => {
    const raw = readReturnUrlFromSearch(searchParams.toString());
    return safeReturnUrl(
      raw ?? userSettingsProfileReturnPath(),
      userSettingsProfileReturnPath(),
    );
  }, [searchParams]);

  const confirmPath = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/account/confirm-email?${qs}` : "/account/confirm-email";
  }, [searchParams]);

  const hasCode = Boolean(searchParams.get("code")?.trim());

  useEffect(() => {
    if (!hasCode) {
      return;
    }
    if (status === "unknown" || status === "loading") {
      return;
    }
    if (status === "guest") {
      navigate(buildAccountLoginPath(confirmPath), { replace: true });
    }
  }, [status, hasCode, navigate, confirmPath]);

  const runConfirm = useCallback(
    async ({ code }) => {
      await confirmEmailAttributeCode(code);
      navigate(returnPath, { replace: true });
    },
    [navigate, returnPath],
  );

  const sessionPending =
    status === "unknown" || status === "loading" || (status === "guest" && hasCode);

  return (
    <Fragment>
      <div className="content account-confirm-email">
        <h1 className="title is-4">{t("AccountPageConfirmEmail")}</h1>
        <p className="help">{t("AccountConfirmEmailIntro")}</p>
        {sessionPending ? (
          <p>{t("AccountConfirmWorking")}</p>
        ) : status === "guest" ? (
          <p className="notification is-info is-light">
            {t("AccountConfirmEmailSignInRequired")}{" "}
            <Link to={buildAccountLoginPath(confirmPath)}>
              {t("AccountPageLogin")}
            </Link>
          </p>
        ) : (
          <AccountConfirmCode
            requireUsername={false}
            onAutoConfirm={runConfirm}
            onManualConfirm={runConfirm}
          />
        )}
        <div className="account-page-footer">
          <p>
            <Link to="/">{t("AccountBackHome")}</Link>
          </p>
        </div>
      </div>
    </Fragment>
  );
}