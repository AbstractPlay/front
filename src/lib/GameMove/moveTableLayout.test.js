import { describe, expect, it } from "vitest";
import { effectiveTurnModel } from "./effectiveTurnModel";
import {
  buildDisplayRounds,
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

  it("resolves sequenced from engine when header absent", () => {
    expect(
      effectiveTurnModel({
        engine: { turnModel: () => "sequenced" },
        game: {},
      })
    ).toBe("sequenced");
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

  it("keeps stride layout for sequenced without header or engine confirmation", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 2, simultaneous: false },
    });
    expect(layout.model).toBe("sequential");
    expect(layout.useRoundGrid).toBe(false);
  });

  it("uses round grid for sequenced when engine confirms (Frogger refills)", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 4, simultaneous: false },
      engine: { turnModel: () => "sequenced" },
    });
    expect(layout.model).toBe("sequenced");
    expect(layout.useRoundGrid).toBe(true);
    expect(layout.numcolumns).toBe(4);
    expect(layout.legacySimulHeader).toBe(false);
    expect(layout.density).toBe("auto");
  });

  it("uses round grid for sequenced from record header", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 2, simultaneous: false },
      gameRec: { header: { "turn-model": "sequenced" } },
    });
    expect(layout.useRoundGrid).toBe(true);
    expect(layout.numcolumns).toBe(2);
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

  it("maps sparse export rows when density is sparse (sequenced)", () => {
    const layout = {
      ...resolveMoveTableLayout({
        game: { numPlayers: 4, simultaneous: false },
        engine: { turnModel: () => "sequenced" },
      }),
      density: "sparse",
    };
    const engine = {
      turnModel: () => "sequenced",
      getRounds: () => [
        [{ move: "p1" }, null, null, null],
        [null, { move: "p2" }, null, null],
        [null, null, { move: "p3" }, null],
        [null, null, null, { move: "p4" }],
        [{ move: "p1b" }, null, null, null],
      ],
    };
    expect(
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx: 0,
        pathLength: 5,
        layout,
        engine,
      })
    ).toBe(0);
    expect(
      pathIndexForMoveCell({
        rowIdx: 1,
        seatIdx: 1,
        pathLength: 5,
        layout,
        engine,
      })
    ).toBe(1);
    expect(
      moveTableRowCount({ pathLength: 5, layout, engine })
    ).toBe(5);
  });

  it("auto density merges unique-actor seat cycle into one row", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 4, simultaneous: false },
      engine: { turnModel: () => "sequenced" },
    });
    const engine = {
      numplayers: 4,
      turnModel: () => "sequenced",
      getPlies: () => [
        { actor: 1, move: "p1", round: 0, playOrder: 1 },
        { actor: 2, move: "p2", round: 0, playOrder: 2 },
        { actor: 3, move: "p3", round: 0, playOrder: 3 },
        { actor: 4, move: "p4", round: 0, playOrder: 4 },
        { actor: 1, move: "p1b", round: 1, playOrder: 1 },
      ],
      getRounds: () => [
        [{ move: "p1" }, null, null, null],
        [null, { move: "p2" }, null, null],
        [null, null, { move: "p3" }, null],
        [null, null, null, { move: "p4" }],
        [{ move: "p1b" }, null, null, null],
      ],
    };
    expect(moveTableRowCount({ pathLength: 5, layout, engine })).toBe(2);
    expect(
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx: 0,
        pathLength: 5,
        layout,
        engine,
      })
    ).toBe(0);
    expect(
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx: 3,
        pathLength: 5,
        layout,
        engine,
      })
    ).toBe(3);
    expect(
      pathIndexForMoveCell({
        rowIdx: 1,
        seatIdx: 0,
        pathLength: 5,
        layout,
        engine,
      })
    ).toBe(4);
  });

  it("auto density keeps duplicate-actor round sparse", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 2, simultaneous: false },
      engine: { turnModel: () => "sequenced" },
    });
    const engine = {
      numplayers: 2,
      getPlies: () => [
        { actor: 2, move: "refill", round: 0, playOrder: 1 },
        { actor: 1, move: "pass", round: 0, playOrder: 2 },
        { actor: 2, move: "follow", round: 0, playOrder: 3 },
      ],
    };
    const display = buildDisplayRounds(engine);
    expect(display).toHaveLength(3);
    expect(moveTableRowCount({ pathLength: 3, layout, engine })).toBe(3);
    expect(
      pathIndexForMoveCell({
        rowIdx: 2,
        seatIdx: 1,
        pathLength: 3,
        layout,
        engine,
      })
    ).toBe(2);
  });

  it("path indices increase left-to-right across dense rows", () => {
    const layout = resolveMoveTableLayout({
      game: { numPlayers: 4, simultaneous: false },
      engine: { turnModel: () => "sequenced" },
    });
    const engine = {
      numplayers: 4,
      getPlies: () => [
        { actor: 1, move: "a", round: 0, playOrder: 1 },
        { actor: 2, move: "b", round: 0, playOrder: 2 },
        { actor: 3, move: "c", round: 0, playOrder: 3 },
        { actor: 4, move: "d", round: 0, playOrder: 4 },
      ],
    };
    const indices = [0, 1, 2, 3].map((seatIdx) =>
      pathIndexForMoveCell({
        rowIdx: 0,
        seatIdx,
        pathLength: 4,
        layout,
        engine,
      })
    );
    expect(indices).toEqual([0, 1, 2, 3]);
  });
});
