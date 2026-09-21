/**
 * @param {unknown} val
 * @returns {string}
 */
export function normalizeFilterQuery(val) {
  if (val == null || val === "") {
    return "";
  }
  return String(val).trim().toLowerCase();
}

/**
 * @param {Record<string, unknown>} original
 * @param {Array<(original: Record<string, unknown>) => unknown>} fieldGetters
 * @param {unknown} query
 */
export function includesStringOnFields(original, fieldGetters, query) {
  const q = normalizeFilterQuery(query);
  if (q === "") {
    return true;
  }
  for (const get of fieldGetters) {
    const v = get(original);
    if (v == null) {
      continue;
    }
    if (Array.isArray(v)) {
      const haystack = v
        .map((item) =>
          item != null && typeof item === "object"
            ? "name" in item && item.name != null
              ? String(item.name)
              : "id" in item && item.id != null
                ? String(item.id)
                : String(item)
            : String(item)
        )
        .join(" ")
        .toLowerCase();
      if (haystack.includes(q)) {
        return true;
      }
    } else if (v != null && typeof v === "object") {
      const haystack = [
        "name" in v && v.name != null ? String(v.name) : "",
        "id" in v && v.id != null ? String(v.id) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (haystack.includes(q)) {
        return true;
      }
    } else if (String(v).toLowerCase().includes(q)) {
      return true;
    }
  }
  return false;
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
