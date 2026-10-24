import { describe, expect, it, vi } from "vitest";
import { buildMoveTreeNavHandlers } from "./moveTreeNavHandlers";

describe("buildMoveTreeNavHandlers", () => {
  const exploration = [{}, {}, {}];
  const path = [[{ path: { moveNumber: 0, exPath: [] } }], [{ path: { moveNumber: 1, exPath: [] } }], [{ path: { moveNumber: 2, exPath: [] } }]];

  it("jumps to the current (latest) position", () => {
    const handleGameMoveClick = vi.fn();
    const focus = { moveNumber: 0, exPath: [] };
    const { onCurrent } = buildMoveTreeNavHandlers({
      focus,
      path,
      exploration,
      handleGameMoveClick,
      curNumVariations: 1,
      onPrevVar: vi.fn(),
      onNextVar: vi.fn(),
    });
    onCurrent();
    expect(handleGameMoveClick).toHaveBeenCalledWith({
      moveNumber: 2,
      exPath: [],
    });
  });

  it("reports position for mobile stepper", () => {
    const focus = { moveNumber: 1, exPath: [] };
    const { mobileStepper } = buildMoveTreeNavHandlers({
      focus,
      path,
      exploration,
      handleGameMoveClick: vi.fn(),
      curNumVariations: 1,
      onPrevVar: vi.fn(),
      onNextVar: vi.fn(),
    });
    expect(mobileStepper.positionIndex).toBe(2);
    expect(mobileStepper.positionTotal).toBe(3);
  });
});
