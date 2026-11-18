/**
 * @typedef {Object} AccountConfirmQuery
 * @property {string} [username]
 * @property {string} [code]
 */

/**
 * Parse username/code from account verification or reset URLs.
 *
 * @param {URLSearchParams} params
 * @returns {AccountConfirmQuery}
 */
export function parseAccountConfirmQuery(params) {
  const username = params.get("username")?.trim() || undefined;
  const code = params.get("code")?.trim() || undefined;
  return { username, code };
}

/**
 * @param {AccountConfirmQuery} query
 * @returns {boolean}
 */
export function canAutoConfirmFromQuery(query) {
  return Boolean(query.code && query.code.length > 0);
}