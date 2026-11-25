import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  DEFAULT_LADDER_HUB_TAB,
  ladderHubTabFromHash,
  ladderHubTabHash,
  ladderHubTabHref,
} from "./ladderHubTabs.js";

describe("ladderHubTabs", () => {
  it("defaults to leaderboard", () => {
    assert.equal(ladderHubTabFromHash(""), DEFAULT_LADDER_HUB_TAB);
    assert.equal(ladderHubTabFromHash("#"), DEFAULT_LADDER_HUB_TAB);
    assert.equal(ladderHubTabFromHash("#nope"), DEFAULT_LADDER_HUB_TAB);
  });

  it("reads activity and chat hashes", () => {
    assert.equal(ladderHubTabFromHash("#activity"), "activity");
    assert.equal(ladderHubTabFromHash("#chat"), "chat");
  });

  it("builds hashes and paths", () => {
    assert.equal(ladderHubTabHash("leaderboard"), "");
    assert.equal(ladderHubTabHash("chat"), "chat");
    assert.equal(ladderHubTabHref("lid", "activity"), "/ladder/lid#activity");
    assert.equal(ladderHubTabHref("lid", "leaderboard"), "/ladder/lid");
  });
});