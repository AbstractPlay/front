import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  canAutoConfirmFromQuery,
  parseAccountConfirmQuery,
} from "../../lib/accountQueryParams";
import { mapCognitoAuthError } from "../../lib/mapCognitoAuthError";

/**
 * Shared click-to-verify shell: auto-submit once when `code` is in the URL, manual fallback otherwise.
 *
 * @param {{
 *   requireUsername?: boolean,
 *   onAutoConfirm: (query: { username?: string, code: string }) => Promise<void>,
 *   onManualConfirm: (query: { username?: string, code: string }) => Promise<void>,
 *   children?: React.ReactNode,
 * }} props
 */
export default function AccountConfirmCode(props) {
  const { requireUsername = false, onAutoConfirm, onManualConfirm, children } =
    props;
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const query = useMemo(
    () => parseAccountConfirmQuery(searchParams),
    [searchParams],
  );
  const [manualOpen, setManualOpen] = useState(false);
  const [username, setUsername] = useState(query.username ?? "");
  const [code, setCode] = useState(query.code ?? "");
  const [errorKey, setErrorKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const autoRan = useRef(false);

  useEffect(() => {
    setUsername(query.username ?? "");
    setCode(query.code ?? "");
  }, [query.username, query.code]);

  useEffect(() => {
    if (autoRan.current || !canAutoConfirmFromQuery(query)) {
      return;
    }
    if (requireUsername && !query.username) {
      return;
    }
    autoRan.current = true;
    setBusy(true);
    setErrorKey("");
    onAutoConfirm({
      username: query.username,
      code: query.code ?? "",
    })
      .then(() => setDone(true))
      .catch((err) => setErrorKey(mapCognitoAuthError(err)))
      .finally(() => setBusy(false));
  }, [query, requireUsername, onAutoConfirm]);

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!code.trim()) {
      setErrorKey("AccountConfirmCodeRequired");
      return;
    }
    if (requireUsername && !username.trim()) {
      setErrorKey("AccountConfirmUsernameRequired");
      return;
    }
    setBusy(true);
    setErrorKey("");
    try {
      await onManualConfirm({
        username: username.trim() || undefined,
        code: code.trim(),
      });
      setDone(true);
    } catch (err) {
      setErrorKey(mapCognitoAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Fragment>
        <p className="notification is-success is-light">{t("AccountConfirmSuccess")}</p>
        {children}
      </Fragment>
    );
  }

  return (
    <Fragment>
      {busy ? <p>{t("AccountConfirmWorking")}</p> : null}
      {errorKey ? (
        <p className="help is-danger">{t(errorKey)}</p>
      ) : null}
      {!manualOpen && canAutoConfirmFromQuery(query) ? (
        <p className="help">{t("AccountConfirmAutoHint")}</p>
      ) : null}
      {manualOpen || !canAutoConfirmFromQuery(query) ? (
        <form onSubmit={handleManualSubmit}>
          {requireUsername ? (
            <div className="field">
              <label className="label" htmlFor="account_confirm_username">
                {t("LoginNameLabel")}
              </label>
              <div className="control">
                <input
                  id="account_confirm_username"
                  className="input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>
          ) : null}
          <div className="field">
            <label className="label" htmlFor="account_confirm_code">
              {t("EMailCode")}
            </label>
            <div className="control">
              <input
                id="account_confirm_code"
                className="input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
              />
            </div>
          </div>
          <button
            type="submit"
            className="button apButton"
            disabled={busy}
          >
            {t("Submit")}
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="button is-small"
          onClick={() => setManualOpen(true)}
        >
          {t("AccountConfirmEnterCodeInstead")}
        </button>
      )}
    </Fragment>
  );
}