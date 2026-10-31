import {
  buildPlayerSearchHaystack,
  isPlayerShapedSearchValue,
} from "./displayNameSearch";
import {
  haystackMatchesAllTokens,
  normalizeSearchQuery,
  searchTokens,
} from "./searchQuery";

/**
 * @param {unknown} val
 * @returns {string}
 */
export function normalizeFilterQuery(val) {
  return normalizeSearchQuery(val);
}

/**
 * @param {unknown} item
 * @returns {string}
 */
function arrayItemToSearchText(item) {
  if (item != null && typeof item === "object") {
    if (isPlayerShapedSearchValue(item)) {
      return buildPlayerSearchHaystack(item);
    }
    if ("name" in item && item.name != null) {
      return String(item.name).toLowerCase();
    }
    if ("id" in item && item.id != null) {
      return String(item.id).toLowerCase();
    }
    return String(item).toLowerCase();
  }
  return String(item).toLowerCase();
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function fieldValueToSearchText(v) {
  if (v == null) {
    return "";
  }
  if (Array.isArray(v)) {
    return v.map((item) => arrayItemToSearchText(item)).join(" ");
  }
  if (typeof v === "object") {
    if (isPlayerShapedSearchValue(v)) {
      return buildPlayerSearchHaystack(v);
    }
    return [
      "name" in v && v.name != null ? String(v.name).toLowerCase() : "",
      "id" in v && v.id != null ? String(v.id).toLowerCase() : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return String(v).toLowerCase();
}

/**
 * @param {Record<string, unknown>} original
 * @param {Array<(original: Record<string, unknown>) => unknown>} fieldGetters
 * @param {unknown} query
 */
export function includesStringOnFields(original, fieldGetters, query) {
  const tokens = searchTokens(query);
  if (tokens.length === 0) {
    return true;
  }
  const haystack = fieldGetters
    .map((get) => fieldValueToSearchText(get(original)))
    .filter(Boolean)
    .join(" ");
  return haystackMatchesAllTokens(haystack, tokens);
}

/** @type {import("@tanstack/react-table").FilterFn<any>} */
export function trimmedIncludesStringColumnFilterFn(row, columnId, filterValue) {
  const tokens = searchTokens(filterValue);
  if (tokens.length === 0) {
    return true;
  }
  const raw = row.getValue(columnId);
  const haystack =
    raw == null ? "" : String(raw).toLowerCase();
  return haystackMatchesAllTokens(haystack, tokens);
}

/** @type {import("@tanstack/react-table").FilterFn<any>} */
export function trimmedGlobalIncludesStringFilterFn(row, _columnId, filterValue) {
  const tokens = searchTokens(filterValue);
  if (tokens.length === 0) {
    return true;
  }
  const haystack = row
    .getAllCells()
    .filter((cell) => cell.column.getCanGlobalFilter())
    .map((cell) => {
      const value = cell.getValue();
      return value == null ? "" : String(value);
    })
    .join(" ")
    .toLowerCase();
  return haystackMatchesAllTokens(haystack, tokens);
}

/** @type {import("@tanstack/react-table").FilterFn<any>} */
export function gameListGlobalFilterFn(row, _columnId, filterValue) {
  const o = row.original;
  return includesStringOnFields(
    o,
    [
      () => o.id,
      () => o.players,
      () => o.variants,
      () => o.winners,
      () => o.numMoves,
      () => o.howEnded,
    ],
    filterValue
  );
}

/** @type {import("@tanstack/react-table").FilterFn<any>} */
export function recentGamesGlobalFilterFn(row, _columnId, filterValue) {
  const o = row.original;
  return includesStringOnFields(
    o,
    [
      () => o.id,
      () => o.metaGame,
      () => o.metaGameName,
      () => o.players,
      () => o.variants,
      () => o.winners,
      () => o.numMoves,
      () => o.howEnded,
    ],
    filterValue
  );
}

/** @type {import("@tanstack/react-table").FilterFn<any>} */
export function pairingGlobalFilterFn(row, _columnId, filterValue) {
  const o = row.original;
  return includesStringOnFields(
    o,
    [
      () => o.round,
      () => o.metagame,
      () => o.p1,
      () => o.p2,
      () => o.variants,
      () => o.clock,
    ],
    filterValue
  );
}
