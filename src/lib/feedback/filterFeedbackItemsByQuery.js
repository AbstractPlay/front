import {
  normalizeSearchQuery,
  queryMatchesHaystack,
} from "../searchQuery";

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
  if (Array.isArray(item.tags)) {
    parts.push(item.tags.join(" "));
  }
  return parts;
}

/**
 * Client-side filter for feedback list rows (boards, mine, admin, history).
 */
export function filterFeedbackItemsByQuery(items, query) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return items;
  }
  return items.filter((item) => {
    const haystack = searchableStringsFromItem(item).join(" ").toLowerCase();
    return queryMatchesHaystack(query, haystack);
  });
}
