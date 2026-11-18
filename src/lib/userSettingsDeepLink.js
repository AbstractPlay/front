/** Query flag: open signed-in User Settings on the Profile tab after navigation. */
export const USER_SETTINGS_OPEN_QUERY = "userSettings";
export const USER_SETTINGS_PROFILE_TAB = "profile";

/**
 * @returns {string}
 */
export function userSettingsProfileReturnPath() {
  return `/?${USER_SETTINGS_OPEN_QUERY}=${USER_SETTINGS_PROFILE_TAB}`;
}

/**
 * @param {URLSearchParams | string} raw
 * @returns {boolean}
 */
export function shouldOpenUserSettingsProfile(raw) {
  const params =
    raw instanceof URLSearchParams
      ? raw
      : new URLSearchParams(
          typeof raw === "string" && raw.startsWith("?") ? raw : `?${raw ?? ""}`,
        );
  return params.get(USER_SETTINGS_OPEN_QUERY) === USER_SETTINGS_PROFILE_TAB;
}