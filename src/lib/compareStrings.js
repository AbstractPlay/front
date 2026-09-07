const collatorCache = new Map();

/** Normalize a UI locale tag for Intl.Collator (guards non-string i18n values). */
export function resolveSortLocale(locale) {
  return typeof locale === "string" && locale ? locale : "en";
}

/** Cached Intl.Collator for repeated string comparisons in one locale. */
export function getStringCollator(locale = "en") {
  const key = resolveSortLocale(locale);
  let collator = collatorCache.get(key);
  if (!collator) {
    collator = new Intl.Collator(key, { sensitivity: "accent" });
    collatorCache.set(key, collator);
  }
  return collator;
}

/** Locale-aware string comparison for sort order (negative / zero / positive). */
export function compareStrings(a, b, locale = "en") {
  return getStringCollator(locale).compare(String(a ?? ""), String(b ?? ""));
}
