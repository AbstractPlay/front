import { describe, expect, it } from "vitest";
import { isIdleMainlineExplorationTip } from "../GameMove/moveTreeVariations";

/**
 * Lab GameMoves uses the compact in-progress path only when this is true;
 * full-tree layout otherwise (including rewound mid-line exploration).
 */
function labUsesCompactInProgressPath(focus, exploration, gameOver) {
  return isIdleMainlineExplorationTip(focus, exploration, gameOver);
}

describe("Lab move table path mode", () => {
  it("uses full tree when exploring a variation after rewind (not idle tip)", () => {
    const exploration = [
      { move: "", children: [] },
      { move: "c5", children: [{ move: "d5", children: [] }] },
      { move: "d4", children: [] },
      { move: "d5", children: [] },
      { move: "e4", children: [] },
    ];
    expect(
      labUsesCompactInProgressPath(
        { moveNumber: 1, exPath: [0] },
        exploration,
        false
      )
    ).toBe(false);
  });

  it("uses compact path on idle mainline tip with no branches", () => {
    const exploration = [
      { move: "" },
      { move: "c5" },
      { move: "d4", children: [] },
    ];
    expect(
      labUsesCompactInProgressPath(
        { moveNumber: 2, exPath: [] },
        exploration,
        false
      )
    ).toBe(true);
  });
});
