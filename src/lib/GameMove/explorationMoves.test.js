import {
  applyExplorationMove,
  filterPersistableExplorationTree,
  isPartialExplorationMove,
  isPersistableExplorationMove,
  validateExplorationMove,
} from "./explorationMoves";

function mockTipEngine() {
  const legal = [">e,12-d1", ">w,12-d1"];

  function createEngine() {
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
      clone() {
        return createEngine();
      },
      stack: { pop: jest.fn(), length: 2 },
      load: jest.fn(),
      gameover: false,
      winner: [],
    };
  }

  return createEngine();
}

function mockEstateEngine() {
  function createEngine() {
    return {
      validateMove(m) {
        if (m === "g3,h2") {
          return { valid: true, complete: 0, canrender: true };
        }
        return { valid: false };
      },
      move(m, { partial = false } = {}) {
        if (partial) return;
        this.last = m;
      },
      clone() {
        return createEngine();
      },
    };
  }

  return createEngine();
}

function mockPrefixEngine() {
  function createEngine() {
    return {
      validateMove(m) {
        if (m === ">n,11") {
          return { valid: true, complete: -1, canrender: true };
        }
        return { valid: false };
      },
      move(m, { partial = false } = {}) {
        if (!partial && m === ">n,11") {
          throw new Error("VALIDATION_GENERAL");
        }
      },
      clone() {
        return createEngine();
      },
    };
  }

  return createEngine();
}

function mockArmadasStyleEngine() {
  function createEngine() {
    return {
      validateMove(m) {
        if (m === "action one") return { valid: true, complete: 0 };
        return { valid: false };
      },
      move(m) {
        this.last = m;
      },
      clone() {
        return createEngine();
      },
    };
  }

  return createEngine();
}

describe("isPartialExplorationMove", () => {
  it("treats tip-only prefixes as partial while editing", () => {
    const engine = mockTipEngine();
    expect(isPartialExplorationMove(engine, ">e")).toBe(true);
    expect(isPersistableExplorationMove(engine, ">e")).toBe(false);
  });

  it("keeps tip-only prefixes partial after Complete Move", () => {
    const engine = mockTipEngine();
    expect(
      isPartialExplorationMove(engine, ">e", { userCompleted: true })
    ).toBe(true);
  });

  it("treats complete compound tips as not partial", () => {
    const engine = mockTipEngine();
    expect(isPartialExplorationMove(engine, ">e,12-d1")).toBe(false);
    expect(isPersistableExplorationMove(engine, ">e,12-d1")).toBe(true);
  });

  it("treats Estate-style complete=0 as partial until Complete Move", () => {
    const engine = mockEstateEngine();
    expect(isPartialExplorationMove(engine, "g3,h2")).toBe(true);
    expect(
      isPartialExplorationMove(engine, "g3,h2", { userCompleted: true })
    ).toBe(false);
    expect(isPersistableExplorationMove(engine, "g3,h2")).toBe(true);
  });

  it("throws when valid without complete", () => {
    const engine = {
      validateMove(m) {
        if (m === ">n") return { valid: true, canrender: true };
        return { valid: false };
      },
    };
    expect(() => isPartialExplorationMove(engine, ">n")).toThrow(
      "validateMove returned valid without complete for move: >n"
    );
    expect(() => validateExplorationMove(engine, ">n")).toThrow(
      "validateMove returned valid without complete for move: >n"
    );
  });

  it("treats complete=0 without canrender as not partial", () => {
    const engine = mockArmadasStyleEngine();
    expect(isPartialExplorationMove(engine, "action one")).toBe(false);
    expect(isPersistableExplorationMove(engine, "action one")).toBe(true);
  });

  it("treats complete=-1 with canrender as partial while editing", () => {
    const engine = mockPrefixEngine();
    expect(isPartialExplorationMove(engine, ">n,11")).toBe(true);
    expect(isPersistableExplorationMove(engine, ">n,11")).toBe(false);
  });
});

describe("validateExplorationMove", () => {
  it("returns partial flag from apply probe, not canrender alone", () => {
    const engine = mockTipEngine();
    expect(validateExplorationMove(engine, ">e")).toEqual({
      valid: true,
      partial: true,
    });
    expect(validateExplorationMove(engine, ">e,12-d1")).toEqual({
      valid: true,
      partial: false,
    });
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
