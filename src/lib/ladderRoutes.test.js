import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  ladderDetailPathActive,
  ladderDetailPathFromGameRef,
  ladderListPath,
} from "./ladderRoutes.js";

describe("ladderRoutes", () => {
  it("builds detail and list paths", () => {
    const id = "abc-123";
    assert.equal(ladderDetailPathActive(id), `/ladder/${id}`);
    assert.equal(ladderListPath("go"), "/ladders/all/go");
    assert.equal(ladderListPath(), "/ladders/all");
  });

  it("maps game ladderId ref", () => {
    assert.equal(ladderDetailPathFromGameRef("lid"), "/ladder/lid");
    assert.equal(ladderDetailPathFromGameRef(""), null);
  });
});
