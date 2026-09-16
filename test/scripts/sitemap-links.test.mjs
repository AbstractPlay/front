import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SITEMAP_EXCLUDED_PATH_PREFIXES,
  SITEMAP_EXPLORE_VIEW_IDS,
  SITEMAP_STATS_TAB_IDS,
  SITEMAP_TOURNAMENT_TAB_IDS,
  buildSitemapLinks,
} from "../../bin/sitemapLinks.mjs";

describe("sitemap links", () => {
  it("includes homepage, explore hub, and nav hubs", () => {
    const urls = buildSitemapLinks([]).map((entry) => entry.url);
    assert.ok(urls.includes("/"));
    assert.ok(urls.includes("/explore/all"));
    assert.ok(urls.includes("/challenges"));
    assert.ok(urls.includes("/recent-games"));
    assert.ok(urls.includes("/events"));
    assert.ok(!urls.includes("/games"));
    assert.ok(!urls.includes("/stats"));
    assert.ok(!urls.includes("/tournaments"));
  });

  it("emits canonical stats and tournament tab paths", () => {
    const urls = buildSitemapLinks([]).map((entry) => entry.url);
    for (const tab of SITEMAP_STATS_TAB_IDS) {
      assert.ok(urls.includes(`/stats/${tab}`));
    }
    for (const tab of SITEMAP_TOURNAMENT_TAB_IDS) {
      assert.ok(urls.includes(`/tournaments/${tab}`));
    }
  });

  it("expands per-meta paths for a sample game", () => {
    const urls = buildSitemapLinks(["go"]).map((entry) => entry.url);
    assert.ok(urls.includes("/games/go"));
    assert.ok(urls.includes("/listgames/current/go"));
    assert.ok(urls.includes("/recent-games/go"));
    assert.ok(urls.includes("/tournaments/open/go"));
  });

  it("covers every explore view id", () => {
    const urls = buildSitemapLinks([]).map((entry) => entry.url);
    for (const mode of SITEMAP_EXPLORE_VIEW_IDS) {
      assert.ok(urls.includes(`/explore/${mode}`));
    }
  });

  it("never lists feedback or wishlist paths", () => {
    const urls = buildSitemapLinks(["go", "chess"]).map((entry) => entry.url);
    for (const url of urls) {
      for (const prefix of SITEMAP_EXCLUDED_PATH_PREFIXES) {
        assert.ok(!url.startsWith(prefix));
      }
    }
  });
});
