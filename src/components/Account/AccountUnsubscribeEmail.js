import React, { Fragment, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { postPublicQuery } from "../../lib/postPublicQuery";

export default function AccountUnsubscribeEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState("loading");

  useEffect(() => {
    const token = searchParams.get("t")?.trim() ?? "";
    if (!token) {
      setState("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const body = await postPublicQuery("unsubscribe_email", { t: token });
        if (cancelled) {
          return;
        }
        if (body && body.ok === true) {
          setState("ok");
        } else {
          setState("invalid");
        }
      } catch {
        if (!cancelled) {
          setState("invalid");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <Fragment>
      <div className="content account-unsubscribe-email">
        <h1 className="title is-4">{t("AccountUnsubscribeEmailTitle")}</h1>
        {state === "loading" ? (
          <p className="help">{t("AccountUnsubscribeEmailWorking")}</p>
        ) : null}
        {state === "ok" ? (
          <p className="notification is-success is-light" role="status">
            {t("AccountUnsubscribeEmailSuccess")}
          </p>
        ) : null}
        {state === "invalid" ? (
          <p className="notification is-warning is-light" role="alert">
            {t("AccountUnsubscribeEmailInvalid")}
          </p>
        ) : null}
        <div className="account-page-footer">
          <p>
            <Link to="/">{t("AccountBackHome")}</Link>
            {" · "}
            <Link to="/account/login">{t("AccountPageLogin")}</Link>
          </p>
        </div>
      </div>
    </Fragment>
  );
}