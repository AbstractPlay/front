import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeCostAllocationTags } from "../../scripts/apply-s3-cost-allocation-tags.mjs";

describe("mergeCostAllocationTags", () => {
  it("preserves existing tags and sets ap allocation keys", () => {
    const merged = mergeCostAllocationTags(
      [
        { Key: "aws:cloudformation:stack-name", Value: "legacy" },
        { Key: "other", Value: "keep" },
      ],
      "prod"
    );
    assert.equal(merged.length, 4);
    assert.deepEqual(
      merged.find((t) => t.Key === "ap:service"),
      { Key: "ap:service", Value: "apfront" }
    );
    assert.deepEqual(
      merged.find((t) => t.Key === "ap:stage"),
      { Key: "ap:stage", Value: "prod" }
    );
    assert.deepEqual(
      merged.find((t) => t.Key === "other"),
      { Key: "other", Value: "keep" }
    );
  });

  it("overwrites prior ap allocation values", () => {
    const merged = mergeCostAllocationTags(
      [{ Key: "ap:stage", Value: "old" }],
      "dev"
    );
    assert.deepEqual(
      merged.find((t) => t.Key === "ap:stage"),
      { Key: "ap:stage", Value: "dev" }
    );
  });
});
