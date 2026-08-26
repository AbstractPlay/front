/** Locale-formatted count; safe when tier merge has not populated the field yet. */
export function formatSummaryCount(value, fallback = "??") {
  return value != null ? value.toLocaleString() : fallback;
}
