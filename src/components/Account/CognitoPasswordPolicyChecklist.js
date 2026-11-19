import React from "react";
import { useTranslation } from "react-i18next";
import {
  COGNITO_PASSWORD_POLICY,
  evaluateCognitoPasswordPolicy,
} from "../../lib/cognitoPasswordPolicy";

/**
 * Live Cognito password rules (green when met, red when not).
 *
 * @param {{ password: string, active: boolean, hintKey?: string }} props
 */
export default function CognitoPasswordPolicyChecklist({
  password,
  active,
  hintKey = "AccountRegisterPasswordHint",
}) {
  const { t } = useTranslation();

  if (!active) {
    return <p className="help">{t(hintKey)}</p>;
  }

  const rules = evaluateCognitoPasswordPolicy(password);
  const count = COGNITO_PASSWORD_POLICY.minimumLength;

  return (
    <ul
      className="account-password-policy"
      aria-live="polite"
      aria-label={t("AccountPasswordPolicyLegend")}
    >
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={rule.met ? "has-text-success" : "has-text-danger"}
        >
          <span className="account-password-policy-mark" aria-hidden="true">
            {rule.met ? "\u2713" : "\u00D7"}
          </span>
          {t(`AccountPasswordRule_${rule.id}`, { count })}
        </li>
      ))}
    </ul>
  );
}