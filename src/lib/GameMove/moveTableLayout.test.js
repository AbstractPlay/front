import { describe, expect, it } from "vitest";
import { effectiveTurnModel } from "./effectiveTurnModel";
import {
  moveTableRowCount,
  pathIndexForMoveCell,
  resolveMoveTableLayout,
} from "./moveTableLayout";

describe("effectiveTurnModel", () => {
  it("prefers record header over engine and game flags", () => {
    expect(
      effectiveTurnModel({
        gameRec: { header: { "turn-model": "skip-turn" } },
        engine: { turnModel: () => "sequential" },
        game: { simultaneous: true },
      })
    ).toBe("skip-turn");
  });

  it("falls back to engine.turnModel when header absent", () => {
    expect(
      effectiveTurnModel({
        engine: { turnModel: () => "skip-turn" },
        game: {},
      })
    ).toBe("skip-turn");
  });

  it("uses legacy simultaneous flag when no header or engine hook", () => {
    expect(
      effectiveTurnModel({
        game: { simultaneous: true },
      })
    ).toBe("simultaneous");
  });

  it("defaults to sequential", () => {
    expect(effectiveTurnModel({ game: {} })).toBe("sequential");
  });
});

describe("resolveMoveTableLayout", () => {
  const game = { numPlayers: 3, simultaneous: true };

  it("keeps legacy single-column layout for game.simultaneous without header", () => {
    const layout = resolveMoveTableLayout({ game });
    expect(layout.legacySimulHeader).toBe(true);
    expect(layout.numcolumns).toBe(1);
    expect(layout.useRoundGrid).toBe(false);
  });

  it("uses round grid for skip-turn from header", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 3, simultaneous: false },
      gameRec: { header: { "turn-model": "skip-turn" } },
    });
    expect(layout.useRoundGrid).toBe(true);
    expect(layout.numcolumns).toBe(3);
    expect(layout.legacySimulHeader).toBe(false);
  });

  it("uses round grid for simultaneous when engine confirms", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 4, simultaneous: true },
      engine: { turnModel: () => "simultaneous" },
    });
    expect(layout.useRoundGrid).toBe(true);
    expect(layout.numcolumns).toBe(4);
    expect(layout.legacySimulHeader).toBe(false);
  });
});

describe("pathIndexForMoveCell", () => {
  it("uses stride packing for sequential layout", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 2, simultaneous: false },
    });
    expect(
      pathIndexForMoveCell({
        rowIdx: 1,
        seatIdx: 0,
        pathLength: 5,
        layout,
      })
    ).toBe(2);
    expect(
      pathIndexForMoveCell({
        rowIdx: 2,
        seatIdx: 1,
        pathLength: 5,
        layout,
      })
    ).toBe(null);
  });

  it("maps null round slots to empty cells", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 3, simultaneous: false },
      gameRec: { header: { "turn-model": "skip-turn" } },
    });
    const engine = {
      getRounds: () => [
        [{ move: "a" }, null, { move: "c" }],
        [null, { move: "b" }, null],
      ],
    };
    expect(
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx: 1,
        pathLength: 4,
        layout,
        engine,
      })
    ).toBe(null);
    expect(
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx: 2,
        pathLength: 4,
        layout,
        engine,
      })
    ).toBe(1);
    expect(
      pathIndexForMoveCell({
        rowIdx: 1,
        seatIdx: 1,
        pathLength: 4,
        layout,
        engine,
      })
    ).toBe(2);
  });

  it("row count follows getRounds length in round grid mode", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 3, simultaneous: false },
      gameRec: { header: { "turn-model": "skip-turn" } },
    });
    const engine = {
      getRounds: () => [[{}, null, {}], [null, {}, null], [{}, {}, null]],
    };
    expect(
      moveTableRowCount({ pathLength: 5, layout, engine })
    ).toBe(3);
  });
});
