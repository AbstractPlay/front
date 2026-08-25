import { gameinfo } from "@abstractplay/gameslib";

/**
 * Inner label from a summarize `highest[].game` key (`batchRatingGameLabel` output).
 * @param {string} gameKey
 * @param {string} metaGameName
 */
export function variantSuffixFromBatchGameKey(gameKey, metaGameName) {
  if (gameKey === metaGameName) {
    return "no variants";
  }
  const prefix = `${metaGameName} (`;
  if (!gameKey.startsWith(prefix) || !gameKey.endsWith(")")) {
    return gameKey;
  }
  return gameKey.slice(prefix.length, -1);
}

/**
 * Human-readable variant label for a batch-ratings game key.
 * @param {string} metaGameUid
 * @param {string} gameKey
 * @param {string} metaGameName
 * @param {(key: string) => string} t
 */
export function formatBatchRatingVariantLabel(
  metaGameUid,
  gameKey,
  metaGameName,
  t
) {
  const suffix = variantSuffixFromBatchGameKey(gameKey, metaGameName);
  if (suffix === "no variants") {
    return t("standingChallenge.noVariants");
  }
  const info = gameinfo.get(metaGameUid);
  if (!info?.variants?.length) {
    return suffix.split("|").join(", ");
  }
  return suffix
    .split("|")
    .map((uid) => info.variants.find((v) => v.uid === uid)?.name ?? uid)
    .join(", ");
}
