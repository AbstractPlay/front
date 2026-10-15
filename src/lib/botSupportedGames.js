import { orderVariantUidsForDisplay } from "./expandVariants";

/**
 * Variant UIDs stored on bots match challenge payloads (explicit selection only).
 * @param {string} meta
 * @param {string[]} variantUids
 * @returns {string[]}
 */
export function botSupportedVariantUids(meta, variantUids) {
  const uids = variantUids ?? [];
  if (!uids.length) {
    return [];
  }
  return orderVariantUidsForDisplay(meta, uids, 2);
}

/**
 * @param {unknown} supported
 * @returns {{ meta: string; variants: string[] }[]}
 */
export function normalizeBotSupportedEntries(supported) {
  if (!Array.isArray(supported)) {
    return [];
  }
  return supported
    .filter((entry) => entry && typeof entry.meta === "string" && entry.meta)
    .map((entry) => ({
      meta: entry.meta,
      variants: botSupportedVariantUids(entry.meta, entry.variants ?? []),
    }));
}

/**
 * @param {{ meta: string; variants?: string[] }} entry
 * @returns {string}
 */
export function botSupportedEntryKey(entry) {
  const variants = botSupportedVariantUids(entry.meta, entry.variants ?? []);
  return `${entry.meta}|${variants.join("|")}`;
}

/**
 * @param {{ meta: string; variants: string[] }[]} entries
 * @param {string} meta
 * @param {string[]} variantUids
 * @returns {number}
 */
export function findBotSupportedDuplicateIndex(entries, meta, variantUids) {
  const key = botSupportedEntryKey({ meta, variants: variantUids });
  return entries.findIndex((entry) => botSupportedEntryKey(entry) === key);
}

/**
 * @param {{ meta: string; variants: string[] }[]} supported
 * @returns {{ meta: string; variants: string[] }[]}
 */
export function botSupportedForApi(supported) {
  return supported.map((entry) => ({
    meta: entry.meta,
    variants: [...(entry.variants ?? [])],
  }));
}
