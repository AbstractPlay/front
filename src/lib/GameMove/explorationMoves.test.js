import {
  applyExplorationMove,
  filterPersistableExplorationTree,
  isPersistableExplorationMove,
  validateExplorationMove,
} from "./explorationMoves";

function mockTipEngine() {
  const legal = [">e,12-d1", ">w,12-d1"];
  return {
    moves: () => legal,
    sameMove: (a, b) => a === b,
    validateMove(m) {
      if (m === ">e") {
        return { valid: true, complete: 0, canrender: true };
      }
      if (legal.includes(m)) {
        return { valid: true, complete: 1 };
      }
      return { valid: false };
    },
    move(m, { partial = false } = {}) {
      if (!partial && m === ">e") {
        throw new Error("VALIDATION_GENERAL");
      }
      this.last = m;
    },
    stack: { pop: jest.fn(), length: 2 },
    load: jest.fn(),
    gameover: false,
    winner: [],
  };
}

describe("validateExplorationMove", () => {
  it("treats tip-only prefixes as partial when not in the legal move list", () => {
    const engine = mockTipEngine();
    expect(validateExplorationMove(engine, ">e")).toEqual({
      valid: true,
      partial: true,
    });
    expect(isPersistableExplorationMove(engine, ">e")).toBe(false);
  });

  it("treats complete compound tips as persistable", () => {
    const engine = mockTipEngine();
    expect(validateExplorationMove(engine, ">e,12-d1")).toEqual({
      valid: true,
      partial: false,
    });
    expect(isPersistableExplorationMove(engine, ">e,12-d1")).toBe(true);
  });

  it("treats complete=0 moves in the legal list as persistable", () => {
    const engine = {
      moves: () => ["action one", "action two"],
      sameMove: (a, b) => a === b,
      validateMove(m) {
        if (m === "action one") return { valid: true, complete: 0 };
        return { valid: false };
      },
      move: jest.fn(),
      stack: { pop: jest.fn(), length: 1 },
      load: jest.fn(),
      gameover: false,
      winner: [],
    };
    expect(isPersistableExplorationMove(engine, "action one")).toBe(true);
  });
});

describe("applyExplorationMove", () => {
  it("replays tip-only moves with partial trusted application", () => {
    const engine = mockTipEngine();
    expect(() => applyExplorationMove(engine, ">e")).not.toThrow();
    expect(engine.last).toBe(">e");
  });

  it("replays complete tips as full moves", () => {
    const engine = mockTipEngine();
    applyExplorationMove(engine, ">e,12-d1");
    expect(engine.last).toBe(">e,12-d1");
  });
});

describe("filterPersistableExplorationTree", () => {
  it("drops partial tips but keeps complete branches", () => {
    const engine = mockTipEngine();
    const filtered = filterPersistableExplorationTree(engine, [
      { move: ">e", children: [] },
      { move: ">e,12-d1", children: [] },
      { move: ">w,12-d1", children: [] },
    ]);
    expect(filtered.map((c) => c.move)).toEqual([">e,12-d1", ">w,12-d1"]);
  });
});
