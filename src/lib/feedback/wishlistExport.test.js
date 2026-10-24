import { describe, expect, it } from "vitest";
import {
  buildWishlistExportDocument,
  stripWishlistExportItem,
  wishlistExportFilename,
} from "./wishlistExport";

describe("stripWishlistExportItem", () => {
  it("removes cover and attachment fields", () => {
    const item = {
      id: "a",
      title: "Catan",
      coverImageUrl: "https://example.com/cover.jpg",
      attachmentKeys: ["staging/foo.png"],
      voteCount: 3,
    };
    expect(stripWishlistExportItem(item)).toEqual({
      id: "a",
      title: "Catan",
      voteCount: 3,
    });
  });
});

describe("buildWishlistExportDocument", () => {
  const rowA = {
    id: "1",
    title: "Alpha",
    effectiveVotes: 10,
    coverImageUrl: "https://x/cover",
  };
  const rowB = {
    id: "2",
    title: "Beta",
    effectiveVotes: 5,
    attachmentKeys: ["k1"],
  };

  it("preserves visible row order and strips bulky fields", () => {
    const doc = buildWishlistExportDocument({
      visibleItems: [rowA, rowB],
      sortBy: "votes",
      categoryFilter: "feasible",
      searchQuery: "  catan  ",
      showClosedOnly: false,
      statusFilter: "",
      generatedAt: "2026-10-24T12:00:00.000Z",
    });
    expect(doc.schemaVersion).toBe(1);
    expect(doc.kind).toBe("wishlist");
    expect(doc.generatedAt).toBe("2026-10-24T12:00:00.000Z");
    expect(doc.count).toBe(2);
    expect(doc.view).toEqual({
      sort: "votes",
      categoryFilter: "feasible",
      statusFilter: null,
      searchQuery: "catan",
      showClosedOnly: false,
    });
    expect(doc.items.map((item) => item.id)).toEqual(["1", "2"]);
    expect(doc.items[0]).not.toHaveProperty("coverImageUrl");
    expect(doc.items[1]).not.toHaveProperty("attachmentKeys");
  });
});

describe("wishlistExportFilename", () => {
  it("uses default name without category filter", () => {
    expect(wishlistExportFilename()).toBe("abstractplay-wishlist.json");
  });

  it("suffixes category when filtered", () => {
    expect(wishlistExportFilename({ categoryFilter: "declined" })).toBe(
      "abstractplay-wishlist-declined.json",
    );
  });
});
