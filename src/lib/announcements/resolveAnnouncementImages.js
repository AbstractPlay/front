const AP_ATT_PATTERN = /ap-att:([^\s)]+)/g;

/**
 * @param {string} body
 * @param {Record<string, string>} urlByKey
 * @returns {string}
 */
export function resolveAnnouncementImages(body, urlByKey = {}) {
  if (!body || Object.keys(urlByKey).length === 0) {
    return body ?? "";
  }
  return body.replace(AP_ATT_PATTERN, (match, key) => {
    const url = urlByKey[key];
    return url ?? match;
  });
}

/**
 * @param {string} body
 * @returns {string[]}
 */
export function apAttKeysInBody(body) {
  if (!body) {
    return [];
  }
  return [...body.matchAll(/ap-att:([^\s)]+)/g)].map((m) => m[1]);
}
