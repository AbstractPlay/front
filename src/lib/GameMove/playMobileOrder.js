/** Default section order for Classic/Lab stacked (card) play layout. */
export const PLAY_MOBILE_CHUNK_ORDER_DEFAULT = [
  "status",
  "move",
  "board",
  "moves",
  "chat",
];

const KNOWN_CHUNKS = new Set(PLAY_MOBILE_CHUNK_ORDER_DEFAULT);

/**
 * Merge persisted user order with required chunks so reordering never drops
 * status, move entry, board, moves, or chat (WCAG reflow on narrow Classic).
 */
export function normalizePlayMobileOrder(order) {
  if (!Array.isArray(order)) {
    return [...PLAY_MOBILE_CHUNK_ORDER_DEFAULT];
  }
  const seen = new Set();
  const result = [];
  for (const key of order) {
    if (typeof key !== "string" || !KNOWN_CHUNKS.has(key) || seen.has(key)) {
      continue;
    }
    result.push(key);
    seen.add(key);
  }
  for (const key of PLAY_MOBILE_CHUNK_ORDER_DEFAULT) {
    if (!seen.has(key)) {
      result.push(key);
    }
  }
  return result;
}

/** Chunks required for a complete play session (subset used in tests). */
export const PLAY_MOBILE_ESSENTIAL_CHUNKS = ["move", "board", "moves"];

export function playMobileOrderIncludesEssentials(order) {
  const normalized = normalizePlayMobileOrder(order);
  return PLAY_MOBILE_ESSENTIAL_CHUNKS.every((key) => normalized.includes(key));
}
