import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  challengeRatedForPayload,
  challengeTeachingModeForPayload,
  isTeachingChallengeEligible,
  isTeachingUndoReviewAtCurrentTip,
  showPieSeatSwapNotice,
} from "../../src/lib/teachingModeChallenge.js";

describe("teachingModeChallenge", () => {
  it("forces unrated when teachingMode is on", () => {
    assert.equal(
      challengeRatedForPayload({
        rated: true,
        forceUnrated: false,
        teachingMode: true,
      }),
      false
    );
  });

  it("includes teachingMode only when eligible", () => {
    assert.equal(challengeTeachingModeForPayload(true, true), true);
    assert.equal(challengeTeachingModeForPayload(true, false), false);
  });

  it("rejects teaching for simultaneous games", () => {
    assert.equal(isTeachingChallengeEligible("assembly", 2), false);
  });

  it("allows teaching for two-player sequential games", () => {
    assert.equal(isTeachingChallengeEligible("saltire", 2), true);
  });

  it("treats numeric player count strings as numbers", () => {
    assert.equal(isTeachingChallengeEligible("saltire", "2"), true);
  });

  it("hides pie seat-swap notice in teaching games", () => {
    const engine = { stack: [{}, {}] };
    assert.equal(
      showPieSeatSwapNotice({ pie: true, teachingMode: true }, engine),
      false
    );
    assert.equal(
      showPieSeatSwapNotice({ pie: true, teachingMode: false }, engine),
      true
    );
  });

  it("detects teaching review only at current tip", () => {
    const undo = { grantorSeat: 1, reviewerSeat: 0 };
    assert.equal(
      isTeachingUndoReviewAtCurrentTip({ teachingUndo: undo }, 0),
      true
    );
    assert.equal(
      isTeachingUndoReviewAtCurrentTip({ teachingUndo: undo }, -1),
      false
    );
  });
});
