import { describe, expect, it } from "vitest";
import {
  filterPathCellsForSeat,
  moveActorSeatForPathIndex,
  pathRowHasExplorationBranch,
} from "./moveTablePathCells";
import {
  getRoundsForLayout,
  moveNumberForCell,
  moveTextForCell,
  pathIndexForMoveCell,
  resolveMoveTableLayout,
} from "./moveTableLayout";

const sequential2pLayout = resolveMoveTableLayout({
  game: { numPlayers: 2, simultaneous: false },
});

describe("Option A regression baselines", () => {
  it("sequential_2p_alternating_mainline", () => {
    const layout = sequential2pLayout;
    const path = [
      [{ move: "a" }],
      [{ move: "b" }],
      [{ move: "c" }],
      [{ move: "d" }],
    ];
    expect(
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx: 0,
        pathLength: 4,
        layout,
      })
    ).toBe(0);
    expect(
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx: 1,
        pathLength: 4,
        layout,
      })
    ).toBe(1);
    expect(
      pathIndexForMoveCell({
        rowIdx: 1,
        seatIdx: 0,
        pathLength: 4,
        layout,
      })
    ).toBe(2);
    expect(
      pathIndexForMoveCell({
        rowIdx: 1,
        seatIdx: 1,
        pathLength: 4,
        layout,
      })
    ).toBe(3);
    expect(
      moveTextForCell({
        layout,
        rounds: undefined,
        rowIdx: 0,
        seatIdx: 0,
        path,
        movenum: 0,
      })
    ).toBe("a");
    expect(
      moveTextForCell({
        layout,
        rounds: undefined,
        rowIdx: 0,
        seatIdx: 1,
        path,
        movenum: 1,
      })
    ).toBe("b");
    expect(
      moveTextForCell({
        layout,
        rounds: undefined,
        rowIdx: 1,
        seatIdx: 0,
        path,
        movenum: 2,
      })
    ).toBe("c");
    expect(
      moveTextForCell({
        layout,
        rounds: undefined,
        rowIdx: 1,
        seatIdx: 1,
        path,
        movenum: 3,
      })
    ).toBe("d");
  });

  it("sequential_3p_stride", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 3, simultaneous: false },
    });
    const indices = [0, 1, 2].map((seatIdx) =>
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx,
        pathLength: 3,
        layout,
      })
    );
    expect(indices).toEqual([0, 1, 2]);
  });

  it("sequenced_mainline_still_uses_rounds_when_stack_aligned", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 2, simultaneous: true },
      engine: { turnModel: () => "sequenced" },
    });
    const roundsFromEngine = [
      ["7ML", "NL"],
      ["7ML@2.-1", null],
      [null, "NL@-1.0"],
    ];
    const engine = {
      numplayers: 2,
      turnModel: () => "sequenced",
      getPlies: () => [],
      getRounds: () => roundsFromEngine,
      stack: [{}, {}, {}, {}],
    };
    const path = [
      [{ move: "7ML,NL" }],
      [{ move: "7ML@2.-1,\u0091" }],
      [{ move: "\u0091,NL@-1.0" }],
    ];
    const rounds = getRoundsForLayout(engine, layout, path.length, path);
    expect(
      moveTextForCell({
        layout,
        rounds,
        rowIdx: 0,
        seatIdx: 0,
        path,
        movenum: 0,
      })
    ).toBe("7ML");
    expect(
      moveTextForCell({
        layout,
        rounds,
        rowIdx: 0,
        seatIdx: 1,
        path,
        movenum: 0,
      })
    ).toBe("NL");
    expect(
      moveTextForCell({
        layout,
        rounds,
        rowIdx: 1,
        seatIdx: 0,
        path,
        movenum: 1,
      })
    ).toBe("7ML@2.-1");
    expect(
      moveTextForCell({
        layout,
        rounds,
        rowIdx: 2,
        seatIdx: 1,
        path,
        movenum: 2,
      })
    ).toBe("NL@-1.0");
  });

  it("sequenced_comma_in_one_ply_not_treated_as_branch_row", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 2 },
      engine: { turnModel: () => "sequenced" },
      gameRec: { header: { "turn-model": "sequenced" } },
    });
    const path = [[{ move: "7ML,NL" }]];
    const rounds = [[{ move: "7ML,NL" }, null]];
    expect(
      moveTextForCell({
        layout,
        rounds,
        rowIdx: 0,
        seatIdx: 0,
        path,
        movenum: 0,
      })
    ).toBe("7ML");
    expect(
      moveTextForCell({
        layout,
        rounds,
        rowIdx: 0,
        seatIdx: 1,
        path,
        movenum: 0,
      })
    ).toBe("NL");
  });

  it("mainline_with_distant_exPath_still_uses_rounds_on_early_indices", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 2 },
      engine: { turnModel: () => "sequenced" },
      gameRec: { header: { "turn-model": "sequenced" } },
    });
    const roundsFromEngine = [
      ["7ML", "NL"],
      ["7ML@2.-1", null],
      [null, "NL@-1.0"],
      ["x", null],
    ];
    const engine = {
      numplayers: 2,
      turnModel: () => "sequenced",
      getPlies: () => [],
      getRounds: () => roundsFromEngine,
      stack: [{}, {}, {}, {}, {}],
    };
    const path = [
      [{ move: "7ML,NL" }],
      [{ move: "7ML@2.-1,\u0091" }],
      [{ move: "\u0091,NL@-1.0" }],
      [
        {
          move: "x",
          path: { moveNumber: 3, exPath: [0] },
        },
      ],
    ];
    const rounds = getRoundsForLayout(engine, layout, path.length, path);
    expect(
      moveTextForCell({
        layout,
        rounds,
        rowIdx: 0,
        seatIdx: 0,
        path,
        movenum: 0,
      })
    ).toBe("7ML");
    expect(pathRowHasExplorationBranch(path[0])).toBe(false);
    expect(pathRowHasExplorationBranch(path[3])).toBe(true);
  });

  it("moveNumberForCell_labels_unchanged_on_stride_layout", () => {
    const layout = sequential2pLayout;
    expect(moveNumberForCell({ layout, seatIdx: 0, movenum: 4 })).toBe("5");
    expect(moveNumberForCell({ layout, seatIdx: 1, movenum: 5 })).toBe("6");
  });
});

describe("sequential_2p_tip_multi_cell_branch_row_hex_like", () => {
  const layout = sequential2pLayout;

  it("routes opponent branches to toMove when only nested premove exists on children (not parent.premove)", () => {
    const branchRow = [
      {
        move: "f9",
        premove: false,
        premoveIndicator: true,
        path: { moveNumber: 23, exPath: [0] },
      },
      {
        move: "i3",
        premove: false,
        premoveIndicator: true,
        path: { moveNumber: 23, exPath: [1] },
      },
    ];
    const ctx = {
      movenum: 23,
      layout,
      playerSeat: 0,
      toMoveSeat: 1,
    };
    expect(
      filterPathCellsForSeat(branchRow, { ...ctx, seatIdx: 0 })
    ).toHaveLength(0);
    expect(
      filterPathCellsForSeat(branchRow, { ...ctx, seatIdx: 1 })
        .map((c) => c.move)
        .sort()
    ).toEqual(["f9", "i3"]);
  });

  it("does not filter single-cell mainline rows (toMoveSeat would empty the mover column)", () => {
    const mainlineOnly = [{ move: "f6", path: { moveNumber: 23, exPath: [] } }];
    const ctx = {
      movenum: 22,
      layout,
      playerSeat: 0,
      toMoveSeat: 1,
    };
    expect(filterPathCellsForSeat(mainlineOnly, { ...ctx, seatIdx: 0 })).toEqual(
      mainlineOnly
    );
    expect(filterPathCellsForSeat(mainlineOnly, { ...ctx, seatIdx: 1 })).toEqual(
      mainlineOnly
    );
  });
  const branchRow = [
    {
      move: "f6",
      premove: true,
      path: { moveNumber: 22, exPath: [0] },
    },
    { move: "i3", path: { moveNumber: 22, exPath: [1] } },
    { move: "j4", path: { moveNumber: 22, exPath: [2] } },
  ];

  it("splits premove vs opponent exploration across seats", () => {
    const seat0 = filterPathCellsForSeat(branchRow, {
      seatIdx: 0,
      movenum: 22,
      layout,
      playerSeat: 0,
      toMoveSeat: 0,
    });
    const seat1 = filterPathCellsForSeat(branchRow, {
      seatIdx: 1,
      movenum: 22,
      layout,
      playerSeat: 0,
      toMoveSeat: 0,
    });
    expect(seat0.map((c) => c.move)).toEqual(["f6"]);
    expect(seat1.map((c) => c.move)).toEqual(["i3", "j4"]);
  });

  it("does not duplicate opponent lines in seat 0", () => {
    const seat0 = filterPathCellsForSeat(branchRow, {
      seatIdx: 0,
      movenum: 22,
      layout,
      playerSeat: 0,
      toMoveSeat: 0,
    });
    expect(seat0.some((c) => c.move === "i3")).toBe(false);
  });

  it("moveActorSeatForPathIndex alternates plies", () => {
    expect(moveActorSeatForPathIndex(21, 2)).toBe(1);
    expect(moveActorSeatForPathIndex(22, 2)).toBe(0);
  });

  it("splits actual mainline and opponent branches on one path row (post-fix b058)", () => {
    const mergedRow = [
      {
        move: "f6",
        path: { moveNumber: 23, exPath: [] },
        class: "gameMove mainlineMove actualMove",
      },
      { move: "f9", path: { moveNumber: 22, exPath: [0] } },
      { move: "i3", path: { moveNumber: 22, exPath: [1] } },
    ];
    const ctx = {
      movenum: 22,
      layout,
      playerSeat: 0,
      toMoveSeat: 1,
    };
    expect(
      filterPathCellsForSeat(mergedRow, { ...ctx, seatIdx: 0 }).map((c) => c.move)
    ).toEqual(["f6"]);
    expect(
      filterPathCellsForSeat(mergedRow, { ...ctx, seatIdx: 1 })
        .map((c) => c.move)
        .sort()
    ).toEqual(["f9", "i3"]);
  });
});
