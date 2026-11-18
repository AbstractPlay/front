import { resetPassword } from "aws-amplify/auth";
import { safeReturnUrl } from "./safeReturnUrl";

/**
 * @param {string} username
 * @param {string} [returnUrl]
 * @returns {string}
 */
export function buildAccountResetPasswordPath(username, returnUrl) {
  const loginName = username.trim();
  const params = new URLSearchParams({
    username: loginName,
    pending: "1",
  });
  if (typeof returnUrl === "string" && returnUrl.trim() !== "") {
    const target = safeReturnUrl(returnUrl, "/");
    params.set("returnUrl", target);
  }
  return `/account/reset-password?${params.toString()}`;
}

/**
 * Cognito forgot-password flow (works signed in or out). Password is unchanged until confirmResetPassword.
 *
 * @param {string} username
 */
export async function requestAccountPasswordReset(username) {
  const loginName = username.trim();
  if (!loginName) {
    throw new Error("username required");
  }
  await resetPassword({ username: loginName });
}