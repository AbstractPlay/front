import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  ladderListPathForTab,
  resolveLadderRouteParams,
} from "./ladderSections.js";

describe("ladderSections", () => {
  it("normalizes missing tab", () => {
    const r = resolveLadderRouteParams(undefined, undefined, "all");
    assert.equal(r.tab, "all");
    assert.ok(r.redirectTo);
  });

  it("builds meta-game list path", () => {
    assert.equal(ladderListPathForTab("all", "go"), "/ladders/all/go");
  });
});
