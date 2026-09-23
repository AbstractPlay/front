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
 * @param {unknown} v
 * @returns {string}
 */
function fieldValueToSearchText(v) {
  if (v == null) {
    return "";
  }
  if (Array.isArray(v)) {
    return v
      .map((item) =>
        item != null && typeof item === "object"
          ? "name" in item && item.name != null
            ? String(item.name)
            : "id" in item && item.id != null
              ? String(item.id)
              : String(item)
          : String(item)
      )
      .join(" ");
  }
  if (typeof v === "object") {
    return [
      "name" in v && v.name != null ? String(v.name) : "",
      "id" in v && v.id != null ? String(v.id) : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return String(v);
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
    .join(" ")
    .toLowerCase();
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
