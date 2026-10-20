import { describe, expect, it } from "vitest";
import {
  collectNextPlyBranchChoices,
  labShouldSubstituteVariationChoicesAtCell,
  labVariationChoicesForMoveCell,
} from "./labMoveTableVariations";
import { focusedMovePathIndex } from "../GameMove/moveTreeVariations";
import { filterLabPathCellsForSeat } from "./labMoveTablePathCells";

const sequential2pLayout = {
  model: "sequential",
  useRoundGrid: false,
  numcolumns: 2,
};

describe("labMoveTableVariations", () => {
  it("lists mainline next ply and exploration children from focus", () => {
    const exploration = [
      { move: "" },
      { move: "a7", children: [{ move: "a6" }] },
      { move: "b7" },
      { move: "c7" },
    ];
    const focus = { moveNumber: 1, exPath: [] };
    const { count, choices } = collectNextPlyBranchChoices(focus, exploration);
    expect(count).toBe(2);
    expect(choices).toEqual([
      { moveNumber: 2, exPath: [] },
      { moveNumber: 1, exPath: [0] },
    ]);
  });

  it("substitutes at the next path row when focus is before a branch", () => {
    const exploration = [
      { move: "" },
      { move: "a7", children: [{ move: "a6" }] },
      { move: "b7" },
    ];
    const focus = { moveNumber: 1, exPath: [] };
    const movenum = focusedMovePathIndex(focus) + 1;
    const { count } = labVariationChoicesForMoveCell(
      movenum,
      focus,
      exploration,
      { gameOver: true }
    );
    expect(count).toBe(2);
    const cells = [{ move: "b7", path: { moveNumber: 2, exPath: [] } }];
    expect(
      labShouldSubstituteVariationChoicesAtCell(
        focus,
        exploration,
        movenum,
        focusedMovePathIndex(focus),
        count,
        cells
      )
    ).toBe(true);
  });
});

describe("filterLabPathCellsForSeat", () => {
  it("keeps mainline and local exploration siblings in one column", () => {
    const row = [
      { move: "b7", path: { moveNumber: 2, exPath: [] } },
      { move: "a6", path: { moveNumber: 1, exPath: [0] } },
    ];
    const ctx = {
      movenum: 1,
      layout: sequential2pLayout,
      playerSeat: 0,
      toMoveSeat: 1,
    };
    expect(
      filterLabPathCellsForSeat(row, { ...ctx, seatIdx: 0 }).map((c) => c.move)
    ).toEqual([]);
    expect(
      filterLabPathCellsForSeat(row, { ...ctx, seatIdx: 1 })
        .map((c) => c.move)
        .sort()
    ).toEqual(["a6", "b7"]);
  });
});
