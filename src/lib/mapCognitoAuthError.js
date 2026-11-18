/** @type {Record<string, string>} */
const COGNITO_ERROR_I18N = {
  UserNotFoundException: "CognitoError_UserNotFound",
  NotAuthorizedException: "CognitoError_NotAuthorized",
  UserNotConfirmedException: "CognitoError_UserNotConfirmed",
  UsernameExistsException: "CognitoError_UsernameExists",
  AliasExistsException: "EMailInUse",
  InvalidPasswordException: "CognitoError_InvalidPassword",
  CodeMismatchException: "CognitoError_CodeMismatch",
  ExpiredCodeException: "CognitoError_CodeExpired",
  LimitExceededException: "CognitoError_LimitExceeded",
  TooManyRequestsException: "CognitoError_TooManyRequests",
  InvalidParameterException: "CognitoError_InvalidParameter",
};

/**
 * Map Amplify/Cognito errors to apfront i18n keys.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function mapCognitoAuthError(error) {
  const code =
    (error && typeof error === "object" && (error.name ?? error.code)) || "";
  if (typeof code === "string" && COGNITO_ERROR_I18N[code]) {
    return COGNITO_ERROR_I18N[code];
  }
  return "CognitoError_Generic";
}