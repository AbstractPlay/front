import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WEBLATE_BRANCH_CONFIG,
  analyzeLocaleDiff,
  isLocalePath,
  parseMergeTreeConflicts,
} from "../../bin/check-weblate-branch.mjs";

describe("check-weblate-branch", () => {
  it("detects formatting-only JSON changes", () => {
    const base = JSON.stringify({ title: "Push" }, null, 2);
    const head = JSON.stringify({ title: "Push" }, null, 4);
    const result = analyzeLocaleDiff(base, head);
    assert.equal(result.formattingOnly, true);
  });

  it("parses legacy merge conflict lines", () => {
    const output = "Merge conflict in public/locales/de/common.json";
    assert.deepEqual(parseMergeTreeConflicts(output), [
      "public/locales/de/common.json",
    ]);
  });

  it("parses git merge-tree v2 changed-in-both conflicts", () => {
    const output = [
      "changed in both",
      "  base   100644 abc123 public/locales/de/common.json",
      "  our    100644 def456 public/locales/de/common.json",
      "  their  100644 fedcba public/locales/de/common.json",
      "@@ -1,4 +1,5 @@",
      "+<<<<<<< .our",
    ].join("\n");
    assert.deepEqual(parseMergeTreeConflicts(output), [
      "public/locales/de/common.json",
    ]);
  });

  it("detects translation value changes", () => {
    const base = JSON.stringify({ title: "Your move" });
    const head = JSON.stringify({ title: "Du bist dran" });
    const result = analyzeLocaleDiff(base, head);
    assert.equal(result.valueChanges.length, 1);
  });

  it("matches locale paths for front", () => {
    assert.equal(
      isLocalePath("public/locales/de/common.json", WEBLATE_BRANCH_CONFIG.localePathRe),
      true,
    );
    assert.equal(
      isLocalePath("src/App.tsx", WEBLATE_BRANCH_CONFIG.localePathRe),
      false,
    );
  });
});
