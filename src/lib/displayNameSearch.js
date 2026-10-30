import anyAscii from "any-ascii";
import { stripBotEmoji } from "../components/Bots/botUtils";
import { queryMatchesHaystack } from "./searchQuery";

const HAYSTACK_CACHE_MAX = 4096;
/** Minimum normalized Levenshtein distance to show a Latin search alias beside the name. */
const SEARCH_ALIAS_MIN_NORMALIZED_DISTANCE = 0.18;
/** @type {Map<string, string>} */
const haystackCache = new Map();
/** @type {Map<string, string | null>} */
const searchAliasCache = new Map();

/**
 * @param {unknown} part
 * @returns {string}
 */
function partToText(part) {
  if (part == null || part === "") {
    return "";
  }
  return String(part);
}

/**
 * @param {string} text
 * @returns {string}
 */
function stripDiacriticsLower(text) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshteinDistance(a, b) {
  if (a === b) {
    return 0;
  }
  if (!a.length) {
    return b.length;
  }
  if (!b.length) {
    return a.length;
  }
  const rows = a.length + 1;
  const cols = b.length + 1;
  /** @type {number[]} */
  let prev = Array.from({ length: cols }, (_, i) => i);
  /** @type {number[]} */
  let curr = new Array(cols);
  for (let i = 1; i < rows; i += 1) {
    curr[0] = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
    curr = new Array(cols);
  }
  return prev[b.length];
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function normalizedEditDistance(a, b) {
  const maxLen = Math.max(a.length, b.length, 1);
  return levenshteinDistance(a, b) / maxLen;
}

/**
 * Latin letters users can type to find this display name, when it differs
 * substantially from the visible form (e.g. Cyrillic). Null for accent-only Latin.
 * @param {unknown} name
 * @returns {string | null}
 */
export function getDisplayNameSearchAlias(name) {
  const cleaned = stripBotEmoji(partToText(name)).trim();
  if (!cleaned) {
    return null;
  }
  const cached = searchAliasCache.get(cleaned);
  if (cached !== undefined) {
    return cached;
  }

  const ascii = anyAscii(cleaned).toLowerCase().replace(/\s+/g, " ").trim();
  if (!ascii) {
    searchAliasCache.set(cleaned, null);
    return null;
  }
  const withoutDiac = stripDiacriticsLower(cleaned);
  if (withoutDiac === ascii || cleaned.toLowerCase() === ascii) {
    searchAliasCache.set(cleaned, null);
    return null;
  }
  const distance = normalizedEditDistance(withoutDiac, ascii);
  const alias =
    distance >= SEARCH_ALIAS_MIN_NORMALIZED_DISTANCE ? ascii : null;
  if (searchAliasCache.size >= HAYSTACK_CACHE_MAX) {
    searchAliasCache.clear();
  }
  searchAliasCache.set(cleaned, alias);
  return alias;
}

/**
 * @param {string} name
 * @param {...unknown} extraParts
 * @returns {string}
 */
export function buildDisplayNameSearchHaystack(name, ...extraParts) {
  const cleanedName = stripBotEmoji(partToText(name));
  const extras = extraParts.map(partToText).filter(Boolean).join("\0");
  const cacheKey = `${cleanedName}\0${extras}`;
  const cached = haystackCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const lanes = [];
  if (cleanedName) {
    lanes.push(cleanedName.toLowerCase());
    lanes.push(stripDiacriticsLower(cleanedName));
    lanes.push(anyAscii(cleanedName).toLowerCase());
  }
  for (const part of extraParts) {
    const text = partToText(part);
    if (!text) {
      continue;
    }
    lanes.push(text.toLowerCase());
  }

  const haystack = lanes.join(" ").replace(/\s+/g, " ").trim();
  if (haystackCache.size >= HAYSTACK_CACHE_MAX) {
    haystackCache.clear();
  }
  haystackCache.set(cacheKey, haystack);
  return haystack;
}

/**
 * @param {{ name?: string, id?: string, searchLabel?: string }} player
 * @returns {string}
 */
export function buildPlayerSearchHaystack(player) {
  if (!player) {
    return "";
  }
  return buildDisplayNameSearchHaystack(
    player.name ?? "",
    player.searchLabel,
    player.id
  );
}

/**
 * @param {unknown} query
 * @param {...unknown} parts
 * @returns {boolean}
 */
export function queryMatchesDisplayNameSearch(query, ...parts) {
  const name = parts.shift();
  return queryMatchesHaystack(
    query,
    buildDisplayNameSearchHaystack(name, ...parts)
  );
}

/**
 * Player directory / API rows: string id + string name.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlayerShapedSearchValue(value) {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const id = "id" in value ? value.id : undefined;
  const name = "name" in value ? value.name : undefined;
  return typeof id === "string" && typeof name === "string";
}
