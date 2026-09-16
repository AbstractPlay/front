function normalizeQuery(query) {
  return String(query ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function searchableStringsFromItem(item) {
  const parts = [];
  if (item.title) {
    parts.push(String(item.title));
  }
  if (item.authorName) {
    parts.push(String(item.authorName));
  }
  if (item.body) {
    parts.push(String(item.body));
  }
  if (item.gameUrl) {
    parts.push(String(item.gameUrl));
  }
  if (item.resolutionNote) {
    parts.push(String(item.resolutionNote));
  }
  if (item.implementedGameMeta?.name) {
    parts.push(String(item.implementedGameMeta.name));
  }
  if (Array.isArray(item.adminTags)) {
    parts.push(item.adminTags.join(" "));
  }
  return parts;
}

/**
 * Client-side filter for feedback list rows (boards, mine, admin, history).
 */
export function filterFeedbackItemsByQuery(items, query) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return items;
  }
  const tokens = normalized.split(" ").filter(Boolean);
  return items.filter((item) => {
    const haystack = searchableStringsFromItem(item).join(" ").toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}
