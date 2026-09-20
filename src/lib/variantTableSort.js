import { compareStrings } from "./compareStrings";
import { orderVariantUidsForDisplay } from "./expandVariants";
import { parseSummaryGameKey, resolveMetaUid } from "./summaryGameKeys";

/**
 * @param {unknown} value
 */
function clockComponent(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Numeric tuple compare: start, then inc, then max.
 * @returns {number}
 */
export function compareClockTriple(startA, incA, maxA, startB, incB, maxB) {
  const fields = [
    [startA, startB],
    [incA, incB],
    [maxA, maxB],
  ];
  for (const [a, b] of fields) {
    const na = clockComponent(a);
    const nb = clockComponent(b);
    if (na !== nb) {
      return na < nb ? -1 : 1;
    }
  }
  return 0;
}

/**
 * @param {"start" | "inc" | "max"} primary
 */
export function compareClockTripleByPrimary(
  primary,
  startA,
  incA,
  maxA,
  startB,
  incB,
  maxB
) {
  const order =
    primary === "inc"
      ? ["inc", "start", "max"]
      : primary === "max"
        ? ["max", "start", "inc"]
        : ["start", "inc", "max"];
  const valuesA = { start: startA, inc: incA, max: maxA };
  const valuesB = { start: startB, inc: incB, max: maxB };
  for (const key of order) {
    const na = clockComponent(valuesA[key]);
    const nb = clockComponent(valuesB[key]);
    if (na !== nb) {
      return na < nb ? -1 : 1;
    }
  }
  return 0;
}

/**
 * @param {string} metaUid
 * @param {readonly string[]} uidsA
 * @param {readonly string[]} uidsB
 * @param {string} locale
 * @param {number} [numPlayers=2]
 * @returns {number}
 */
export function compareVariantSelections(
  metaUid,
  uidsA,
  uidsB,
  locale,
  numPlayers = 2
) {
  const resolved = metaUid ? resolveMetaUid(metaUid) : "";
  const orderedA = orderVariantUidsForDisplay(resolved, [...uidsA], numPlayers);
  const orderedB = orderVariantUidsForDisplay(resolved, [...uidsB], numPlayers);
  const len = Math.max(orderedA.length, orderedB.length);
  for (let i = 0; i < len; i += 1) {
    const a = orderedA[i] ?? "";
    const b = orderedB[i] ?? "";
    if (a === b) {
      continue;
    }
    if (a === "") {
      return -1;
    }
    if (b === "") {
      return 1;
    }
    const cmp = compareStrings(a, b, locale);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return 0;
}

/**
 * @param {string} gameKeyA
 * @param {string} gameKeyB
 * @param {string} locale
 * @returns {number}
 */
export function compareSummaryGameKeys(gameKeyA, gameKeyB, locale) {
  const a = parseSummaryGameKey(gameKeyA);
  const b = parseSummaryGameKey(gameKeyB);
  const metaCmp = compareStrings(a.metaUid, b.metaUid, locale);
  if (metaCmp !== 0) {
    return metaCmp;
  }
  return compareVariantSelections(
    a.metaUid,
    a.variantUids,
    b.variantUids,
    locale
  );
}

/**
 * @param {string} gameNameA
 * @param {string} metaA
 * @param {readonly string[]} uidsA
 * @param {string} gameNameB
 * @param {string} metaB
 * @param {readonly string[]} uidsB
 * @param {string} locale
 */
export function compareTournamentRow(
  gameNameA,
  metaA,
  uidsA,
  gameNameB,
  metaB,
  uidsB,
  locale
) {
  const nameCmp = compareStrings(gameNameA, gameNameB, locale);
  if (nameCmp !== 0) {
    return nameCmp;
  }
  const metaCmp = compareStrings(metaA, metaB, locale);
  if (metaCmp !== 0) {
    return metaCmp;
  }
  return compareVariantSelections(metaA, uidsA, uidsB, locale);
}

/**
 * @param {{
 *   getMeta: (row: { original: object }) => string,
 *   getUids: (row: { original: object }) => readonly string[],
 *   locale: string,
 *   numPlayers?: number,
 *   compareMetaFirst?: boolean,
 * }} opts
 */
export function variantSelectionSortingFn(opts) {
  const {
    getMeta,
    getUids,
    locale,
    numPlayers = 2,
    compareMetaFirst = false,
  } = opts;
  return (rowA, rowB) => {
    const metaA = getMeta(rowA);
    const metaB = getMeta(rowB);
    if (compareMetaFirst) {
      const metaCmp = compareStrings(metaA, metaB, locale);
      if (metaCmp !== 0) {
        return metaCmp;
      }
    }
    const uidsA = getUids(rowA) ?? [];
    const uidsB = getUids(rowB) ?? [];
    if (!compareMetaFirst && metaA !== metaB) {
      const metaCmp = compareStrings(metaA, metaB, locale);
      if (metaCmp !== 0) {
        return metaCmp;
      }
    }
    const resolvedMeta = metaA || metaB;
    return compareVariantSelections(
      resolvedMeta,
      uidsA,
      uidsB,
      locale,
      numPlayers
    );
  };
}

/**
 * @param {string} locale
 * @param {(row: { original: object }) => string} [getGameKey]
 */
export function summaryGameKeySortingFn(
  locale,
  getGameKey = (row) => row.original.gameKey ?? row.original.id ?? ""
) {
  return (rowA, rowB) =>
    compareSummaryGameKeys(getGameKey(rowA), getGameKey(rowB), locale);
}

/**
 * @param {{
 *   getStart: (row: { original: object }) => unknown,
 *   getInc: (row: { original: object }) => unknown,
 *   getMax: (row: { original: object }) => unknown,
 *   primary?: "start" | "inc" | "max",
 * }} opts
 */
export function clockTupleSortingFn(opts) {
  const { getStart, getInc, getMax, primary = "start" } = opts;
  return (rowA, rowB) => {
    const compare =
      primary === "start"
        ? compareClockTriple
        : (sa, ia, ma, sb, ib, mb) =>
            compareClockTripleByPrimary(primary, sa, ia, ma, sb, ib, mb);
    return compare(
      getStart(rowA),
      getInc(rowA),
      getMax(rowA),
      getStart(rowB),
      getInc(rowB),
      getMax(rowB)
    );
  };
}
