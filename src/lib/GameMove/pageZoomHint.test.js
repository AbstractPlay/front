import { describe, expect, it, beforeEach } from "vitest";
import {
  dismissPageZoomBoardHint,
  isPageZoomBoardHintDismissed,
  shouldShowPageZoomBoardHint,
} from "./pageZoomHint";

describe("pageZoomHint", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows when page zoom is active and board zoom is available", () => {
    expect(
      shouldShowPageZoomBoardHint({
        pageZoomActive: true,
        boardZoomAvailable: true,
        gameReady: true,
      })
    ).toBe(true);
  });

  it("hides when board zoom is unavailable (narrow layout)", () => {
    expect(
      shouldShowPageZoomBoardHint({
        pageZoomActive: true,
        boardZoomAvailable: false,
        gameReady: true,
      })
    ).toBe(false);
  });

  it("stays dismissed in localStorage", () => {
    dismissPageZoomBoardHint();
    expect(isPageZoomBoardHintDismissed()).toBe(true);
    expect(
      shouldShowPageZoomBoardHint({
        pageZoomActive: true,
        boardZoomAvailable: true,
        gameReady: true,
      })
    ).toBe(false);
  });
});
