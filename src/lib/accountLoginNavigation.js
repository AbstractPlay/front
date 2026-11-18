import { safeReturnUrl } from "./safeReturnUrl";

/**
 * @param {unknown} returnUrl
 * @returns {string}
 */
export function buildAccountLoginPath(returnUrl) {
  const target = safeReturnUrl(
    typeof returnUrl === "string" ? returnUrl : "/",
    "/",
  );
  return `/account/login?returnUrl=${encodeURIComponent(target)}`;
}

/**
 * Full navigation to in-app login (used from api.js and session expiry).
 *
 * @param {string} [returnUrl]
 */
export function redirectToSignIn(returnUrl) {
  if (typeof window === "undefined") {
    return;
  }
  const current =
    returnUrl ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(buildAccountLoginPath(current));
}