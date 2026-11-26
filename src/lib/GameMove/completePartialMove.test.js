import { describe, expect, it } from "vitest";
import {
  completePartialMoveFromDraft,
  shouldShowCompleteMoveButton,
} from "./completePartialMove";

describe("completePartialMoveFromDraft", () => {
  it("re-validates draft and sets complete", () => {
    const next = completePartialMoveFromDraft({
      move: { move: "6", rendered: "", valid: true, complete: 0 },
      moveDraft: "6.5",
      validate: (value) => ({
        valid: true,
        complete: 0,
        message: `komi ${value}`,
      }),
    });
    expect(next.move).toBe("6.5");
    expect(next.complete).toBe(1);
    expect(next.message).toBe("komi 6.5");
  });
});

describe("shouldShowCompleteMoveButton", () => {
  it("shows for committed partial moves", () => {
    expect(
      shouldShowCompleteMoveButton(
        { valid: true, complete: 0, move: "6" },
        "6"
      )
    ).toBe(true);
  });

  it("shows when draft is ahead of debounced commit", () => {
    expect(
      shouldShowCompleteMoveButton(
        { valid: true, complete: -1, move: "" },
        "6.5"
      )
    ).toBe(true);
  });

  it("hides when move is already complete", () => {
    expect(
      shouldShowCompleteMoveButton({ valid: true, complete: 1, move: "6.5" }, "6.5")
    ).toBe(false);
  });
});