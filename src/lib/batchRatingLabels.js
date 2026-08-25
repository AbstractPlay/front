import {
  formatVariantUids,
  metaUidFromSummaryGameKey,
  parseSummaryGameKey,
} from "./summaryGameKeys";

/**
 * Inner label from a summarize `highest[].game` key (`batchRatingGameLabel` output).
 * @param {string} gameKey
 */
export function variantSuffixFromBatchGameKey(gameKey) {
  const { variantUids } = parseSummaryGameKey(gameKey);
  if (!variantUids.length) {
    return "no variants";
  }
  return variantUids.join("|");
}

/**
 * Human-readable variant label for a batch-ratings game key.
 * @param {string} metaGameUid
 * @param {string} gameKey
 * @param {(key: string) => string} t
 */
export function formatBatchRatingVariantLabel(metaGameUid, gameKey, t) {
  const { metaUid, variantUids } = parseSummaryGameKey(gameKey);
  if (!variantUids.length) {
    return "";
  }
  const uid = metaGameUid || metaUid;
  return formatVariantUids(uid, variantUids, t);
}

export { metaUidFromSummaryGameKey };
