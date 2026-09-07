const collatorCache = new Map();

/** Cached Intl.Collator for repeated string comparisons in one locale. */
export function getStringCollator(locale = "en") {
  const key = locale || "en";
  let collator = collatorCache.get(key);
  if (!collator) {
    collator = new Intl.Collator(key, { sensitivity: "accent" });
    collatorCache.set(key, collator);
  }
  return collator;
}

/** Locale-aware string comparison for sort order (negative / zero / positive). */
export function compareStrings(a, b, locale = "en") {
  return getStringCollator(locale).compare(a ?? "", b ?? "");
}
