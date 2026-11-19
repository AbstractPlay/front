/**
 * Abstract Play player pool password policy (matches Cognito prod/dev user pools).
 */
export const COGNITO_PASSWORD_POLICY = {
  minimumLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
};

/**
 * @typedef {'minLength' | 'uppercase' | 'lowercase' | 'number' | 'symbol'} PasswordRuleId
 * @typedef {{ id: PasswordRuleId, met: boolean }} PasswordRuleStatus
 */

/**
 * @param {string} password
 * @returns {PasswordRuleStatus[]}
 */
export function evaluateCognitoPasswordPolicy(password) {
  const {
    minimumLength,
    requireUppercase,
    requireLowercase,
    requireNumbers,
    requireSymbols,
  } = COGNITO_PASSWORD_POLICY;
  /** @type {PasswordRuleStatus[]} */
  const rules = [
    { id: "minLength", met: password.length >= minimumLength },
  ];
  if (requireUppercase) {
    rules.push({ id: "uppercase", met: /[A-Z]/.test(password) });
  }
  if (requireLowercase) {
    rules.push({ id: "lowercase", met: /[a-z]/.test(password) });
  }
  if (requireNumbers) {
    rules.push({ id: "number", met: /[0-9]/.test(password) });
  }
  if (requireSymbols) {
    rules.push({ id: "symbol", met: /[^A-Za-z0-9]/.test(password) });
  }
  return rules;
}

/**
 * @param {string} password
 * @returns {boolean}
 */
export function passwordMeetsCognitoPolicy(password) {
  return evaluateCognitoPasswordPolicy(password).every((rule) => rule.met);
}