import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MoveTreeMobileChrome from "./MoveTreeMobileChrome";

const STEPPER_BODY_CLASS = "move-tree-mobile-stepper-active";

function session(overrides = {}) {
  return {
    screenWidth: 390,
    t: (key) => key,
    focus: { moveNumber: 0, exPath: [] },
    game: { gameOver: true },
    error: null,
    isGameLoading: false,
    handleGameMoveClick: vi.fn(),
    explorationRef: { current: { nodes: [{ children: [] }, { children: [] }] } },
    explorationVersion: 0,
    ...overrides,
  };
}

describe("MoveTreeMobileChrome", () => {
  afterEach(() => {
    document.body.classList.remove(STEPPER_BODY_CLASS);
  });

  it("does not mount the stepper when layout width is desktop-wide", () => {
    render(<MoveTreeMobileChrome session={session({ screenWidth: 1280 })} />);
    expect(screen.queryByRole("toolbar", { name: "Moves" })).not.toBeInTheDocument();
    expect(document.body.classList.contains("move-tree-mobile-stepper-active")).toBe(
      false
    );
  });

  it("mounts the stepper when layout width is narrow", () => {
    render(<MoveTreeMobileChrome session={session({ screenWidth: 390 })} />);
    expect(screen.getByRole("toolbar", { name: "Moves" })).toBeInTheDocument();
    expect(document.body.classList.contains("move-tree-mobile-stepper-active")).toBe(
      true
    );
  });
});
