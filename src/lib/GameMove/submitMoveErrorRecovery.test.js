import { describe, expect, it } from "vitest";
import {
  parseMoveNumberMismatch,
  submitMoveMismatchLooksApplied,
} from "./submitMoveErrorRecovery";

describe("submitMoveErrorRecovery", () => {
  it("parseMoveNumberMismatch reads server copy", () => {
    expect(
      parseMoveNumberMismatch(
        "Move number mismatch: browser has 66 moves but game has 67 moves. Please refresh your browser."
      )
    ).toEqual({ browserMoves: 66, gameMoves: 67 });
  });

  it("submitMoveMismatchLooksApplied matches tip move", () => {
    const mismatch = { browserMoves: 66, gameMoves: 67 };
    expect(
      submitMoveMismatchLooksApplied({
        mismatch,
        explorationNodeCount: 67,
        attemptedMove: "6SY>8,0",
        tipMove: "6SY>8,0",
      })
    ).toBe(true);
    expect(
      submitMoveMismatchLooksApplied({
        mismatch,
        explorationNodeCount: 67,
        attemptedMove: "6SY>8,0",
        tipMove: "pass",
      })
    ).toBe(false);
  });

  it("submitMoveMismatchLooksApplied requires node count to match server", () => {
    const mismatch = { browserMoves: 66, gameMoves: 67 };
    expect(
      submitMoveMismatchLooksApplied({
        mismatch,
        explorationNodeCount: 66,
        attemptedMove: "6SY>8,0",
        tipMove: "6SY>8,0",
      })
    ).toBe(false);
  });
});
