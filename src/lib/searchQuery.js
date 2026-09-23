/**
 * @param {unknown} query
 * @returns {string}
 */
export function normalizeSearchQuery(query) {
  if (query == null || query === "") {
    return "";
  }
  return String(query).trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * @param {unknown} query
 * @returns {string[]}
 */
export function searchTokens(query) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return [];
  }
  return normalized.split(" ").filter(Boolean);
}

/**
 * @param {string} haystack
 * @param {string[]} tokens
 * @returns {boolean}
 */
export function haystackMatchesAllTokens(haystack, tokens) {
  if (tokens.length === 0) {
    return true;
  }
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Case-insensitive match: query is normalized to lowercase tokens; haystack is lowercased here.
 *
 * @param {unknown} query
 * @param {unknown} haystack
 * @returns {boolean}
 */
export function queryMatchesHaystack(query, haystack) {
  const normalizedHaystack =
    haystack == null ? "" : String(haystack).toLowerCase();
  return haystackMatchesAllTokens(normalizedHaystack, searchTokens(query));
}
