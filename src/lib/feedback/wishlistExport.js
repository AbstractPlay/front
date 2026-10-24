const WISHLIST_EXPORT_OMIT = ["coverImageUrl", "attachmentKeys"];

/**
 * Strip presigned / bulky fields from a wishlist row for JSON export.
 */
export function stripWishlistExportItem(item) {
  if (!item || typeof item !== "object") {
    return item;
  }
  const out = { ...item };
  for (const key of WISHLIST_EXPORT_OMIT) {
    delete out[key];
  }
  return out;
}

/**
 * Build a JSON document for the wishlist board download (WYSIWYG: same order as visibleItems).
 */
export function buildWishlistExportDocument({
  visibleItems,
  sortBy,
  categoryFilter,
  searchQuery,
  showClosedOnly = false,
  statusFilter,
  generatedAt,
}) {
  const trimmedSearch = typeof searchQuery === "string" ? searchQuery.trim() : "";
  return {
    schemaVersion: 1,
    generatedAt: generatedAt ?? new Date().toISOString(),
    kind: "wishlist",
    view: {
      sort: sortBy,
      categoryFilter: categoryFilter || null,
      statusFilter: statusFilter || null,
      searchQuery: trimmedSearch || null,
      showClosedOnly: Boolean(showClosedOnly),
    },
    count: visibleItems.length,
    items: visibleItems.map(stripWishlistExportItem),
  };
}

export function wishlistExportFilename({ categoryFilter } = {}) {
  if (categoryFilter) {
    return `abstractplay-wishlist-${categoryFilter}.json`;
  }
  return "abstractplay-wishlist.json";
}
