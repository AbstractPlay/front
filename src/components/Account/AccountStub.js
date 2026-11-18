import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/** @type {Record<string, string>} */
const PAGE_TITLE_KEYS = {
  login: "AccountPageLogin",
  register: "AccountPageRegister",
  verify: "AccountPageVerify",
  "forgot-password": "AccountPageForgotPassword",
  "reset-password": "AccountPageResetPassword",
  "forgot-username": "AccountPageForgotUsername",
  "confirm-email": "AccountPageConfirmEmail",
};

/**
 * Phase 0 placeholder for managed auth routes (replaced in Phases A–D).
 *
 * @param {{ pageId: string }} props
 */
export default function AccountStub(props) {
  const { pageId } = props;
  const { t } = useTranslation();
  const titleKey = PAGE_TITLE_KEYS[pageId] ?? "AccountPageLogin";

  return (
    <Fragment>
      <div className="content account-stub">
        <h1 className="title is-4">{t(titleKey)}</h1>
        <p className="subtitle is-6">{t("AccountStubPhase0")}</p>
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