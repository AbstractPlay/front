import { describe, expect, it, vi } from "vitest";
import { buildMoveTreeMobileStepperProps } from "./buildMoveTreeMobileStepperProps";

describe("buildMoveTreeMobileStepperProps", () => {
  it("returns null without focus", () => {
    expect(
      buildMoveTreeMobileStepperProps({
        focus: null,
        exploration: [{}],
        game: { gameOver: true },
        handleGameMoveClick: vi.fn(),
      })
    ).toBeNull();
  });

  it("exposes stepper position from exploration length", () => {
    const exploration = [
      { children: [] },
      { children: [] },
      { children: [] },
    ];
    const props = buildMoveTreeMobileStepperProps({
      focus: { moveNumber: 0, exPath: [] },
      exploration,
      game: { gameOver: true },
      handleGameMoveClick: vi.fn(),
    });
    expect(props).not.toBeNull();
    expect(props.positionIndex).toBe(1);
    expect(props.positionTotal).toBe(3);
  });
});
