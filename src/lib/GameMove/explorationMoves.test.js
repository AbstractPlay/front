import { vi } from "vitest";
import {
  applyExplorationMove,
  filterPersistableExplorationTree,
  isPartialExplorationMove,
  isPersistableExplorationMove,
  requiresPartialExplorationApply,
  validateExplorationMove,
} from "./explorationMoves";

vi.mock("@abstractplay/gameslib", () => ({
  GameFactory: (metaGame, _state) => {
    if (metaGame === "jacynth") {
      return {
        move(m, { partial = false } = {}) {
          if (partial) return;
          if (m === "5ml-e1") return;
          throw new Error("VALIDATION_GENERAL");
        },
        validateMove(m) {
          if (m === "5ml-e1")
            return { valid: true, complete: 0, canrender: true };
          return { valid: false };
        },
      };
    }
    throw new Error(`Unexpected GameFactory probe for ${metaGame}`);
  },
}));

const META_CARNAC = "carnac";
const META_ESTATE = "estate";

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
      stack: { pop: vi.fn(), length: 2 },
      load: vi.fn(),
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

function mockHomeworldsSacrificeEngine() {
  const CMD_PARAMETERS = "The wrong number of parameters were provided.";
  const partialMoves = ["sacrifice g2 Eyuf", "sacrifice g2 Eyuf, build"];

  function createEngine() {
    return {
      validateMove(m) {
        if (partialMoves.includes(m)) {
          return { valid: true, complete: -1, canrender: true };
        }
        return { valid: false };
      },
      move(m, { partial = false } = {}) {
        if (!partial && partialMoves.includes(m)) {
          const err = new Error(CMD_PARAMETERS);
          err.name = "UserFacingError";
          err.client = CMD_PARAMETERS;
          throw err;
        }
        this.last = m;
      },
      clone() {
        return createEngine();
      },
      cheapSerialize() {
        return {};
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

function mockEntropySimEngine() {
  function createEngine() {
    return {
      validateMove(m, player) {
        if (player === 1) {
          if (m === "d5") {
            return { valid: true, complete: -1, canrender: true };
          }
          if (m === "d5-e4") {
            return { valid: true, complete: 1 };
          }
          if (m === "d4") {
            return { valid: true, complete: 1 };
          }
        }
        return { valid: false };
      },
      move(m, { partial = false } = {}) {
        const parts = m.split(",");
        if (parts.length !== 2) {
          throw new Error("MOVES_SIMULTANEOUS_PARTIAL");
        }
        if (!partial && parts[0] === "d5" && !parts[0].includes("-")) {
          throw new Error("VALIDATION_GENERAL");
        }
        this.last = m;
      },
      clone() {
        return createEngine();
      },
      cheapSerialize() {
        return {};
      },
      stack: { pop: vi.fn(), length: 2 },
      load: vi.fn(),
      gameover: false,
      winner: [],
    };
  }

  return createEngine();
}

const entropySimContext = {
  metaGame: "entropy",
  simultaneous: true,
  playerIndex: 0,
  numPlayers: 2,
};

function mockJacynthEngine() {
  return {
    validateMove(m) {
      if (m === "5ml-e1") {
        return { valid: true, complete: 0, canrender: true };
      }
      return { valid: false };
    },
    cheapSerialize() {
      return jacynthFixtureState;
    },
  };
}

const jacynthFixtureState = {
  game: "jacynth",
  numplayers: 2,
  variants: [],
  gameover: false,
  winner: [],
  stack: [
    {
      _version: "20241212",
      _results: [],
      _timestamp: "2026-08-12T03:02:19.512Z",
      currplayer: 1,
      board: {
        dataType: "Map",
        value: [
          ["a6", "4VL"],
          ["b5", "NL"],
          ["c4", "6SY"],
          ["d3", "9LK"],
          ["e2", "6MV"],
          ["f1", "5YK"],
        ],
      },
      claimed: { dataType: "Map", value: [] },
      influence: [4, 4],
      hands: [
        ["5ML", "2SY", "1L"],
        ["7VY", "7ML", "2VL"],
      ],
    },
  ],
};

describe("isPartialExplorationMove", () => {
  it("treats tip-only prefixes as partial while editing", () => {
    const engine = mockTipEngine();
    expect(
      isPartialExplorationMove(engine, ">e", { metaGame: META_CARNAC })
    ).toBe(true);
    expect(isPersistableExplorationMove(engine, ">e", META_CARNAC)).toBe(false);
  });

  it("keeps tip-only prefixes partial after Complete Move", () => {
    const engine = mockTipEngine();
    expect(
      isPartialExplorationMove(engine, ">e", {
        userCompleted: true,
        metaGame: META_CARNAC,
      })
    ).toBe(true);
  });

  it("treats complete compound tips as not partial", () => {
    const engine = mockTipEngine();
    expect(
      isPartialExplorationMove(engine, ">e,12-d1", { metaGame: META_CARNAC })
    ).toBe(false);
    expect(isPersistableExplorationMove(engine, ">e,12-d1", META_CARNAC)).toBe(
      true
    );
  });

  it("treats Estate-style complete=0 as partial until Complete Move", () => {
    const engine = mockEstateEngine();
    expect(
      isPartialExplorationMove(engine, "g3,h2", { metaGame: META_ESTATE })
    ).toBe(true);
    expect(
      isPartialExplorationMove(engine, "g3,h2", {
        userCompleted: true,
        metaGame: META_ESTATE,
      })
    ).toBe(false);
    expect(isPersistableExplorationMove(engine, "g3,h2", META_ESTATE)).toBe(
      true
    );
  });

  it("treats Jacynth optional-influence placements as partial until Complete Move", () => {
    const engine = mockJacynthEngine();
    const move = "5ml-e1";
    expect(engine.validateMove(move).complete).toBe(0);
    expect(
      isPartialExplorationMove(engine, move, { metaGame: "jacynth" })
    ).toBe(true);
    expect(
      isPartialExplorationMove(engine, move, {
        userCompleted: true,
        metaGame: "jacynth",
      })
    ).toBe(false);
    expect(isPersistableExplorationMove(engine, move, "jacynth")).toBe(true);
  });

  it("throws when valid without complete", () => {
    const engine = {
      validateMove(m) {
        if (m === ">n") return { valid: true, canrender: true };
        return { valid: false };
      },
    };
    expect(() =>
      isPartialExplorationMove(engine, ">n", { metaGame: META_CARNAC })
    ).toThrow("validateMove returned valid without complete for move: >n");
    expect(() =>
      validateExplorationMove(engine, ">n", { metaGame: META_CARNAC })
    ).toThrow("validateMove returned valid without complete for move: >n");
  });

  it("treats complete=0 without canrender as not partial", () => {
    const engine = mockArmadasStyleEngine();
    expect(
      isPartialExplorationMove(engine, "action one", { metaGame: "armadas" })
    ).toBe(false);
    expect(isPersistableExplorationMove(engine, "action one", "armadas")).toBe(
      true
    );
  });

  it("treats complete=-1 with canrender as partial while editing", () => {
    const engine = mockPrefixEngine();
    expect(
      isPartialExplorationMove(engine, ">n,11", { metaGame: META_CARNAC })
    ).toBe(true);
    expect(isPersistableExplorationMove(engine, ">n,11", META_CARNAC)).toBe(
      false
    );
  });

  it("keeps complete=-1 partial after Complete Move", () => {
    const engine = mockPrefixEngine();
    expect(
      isPartialExplorationMove(engine, ">n,11", {
        userCompleted: true,
        metaGame: META_CARNAC,
      })
    ).toBe(true);
    expect(
      requiresPartialExplorationApply(engine, ">n,11", {
        metaGame: META_CARNAC,
      })
    ).toBe(true);
  });

  it("treats Homeworlds sacrifice chains as partial with and without Complete Move", () => {
    const engine = mockHomeworldsSacrificeEngine();
    for (const move of ["sacrifice g2 Eyuf", "sacrifice g2 Eyuf, build"]) {
      expect(
        isPartialExplorationMove(engine, move, { metaGame: "homeworlds" })
      ).toBe(true);
      expect(
        isPartialExplorationMove(engine, move, {
          userCompleted: true,
          metaGame: "homeworlds",
        })
      ).toBe(true);
      expect(() =>
        applyExplorationMove(engine, move, { metaGame: "homeworlds" })
      ).not.toThrow();
      expect(engine.last).toBe(move);
    }
  });
});

describe("validateExplorationMove", () => {
  it("returns partial flag from apply probe, not canrender alone", () => {
    const engine = mockTipEngine();
    expect(
      validateExplorationMove(engine, ">e", { metaGame: META_CARNAC })
    ).toEqual({
      valid: true,
      partial: true,
    });
    expect(
      validateExplorationMove(engine, ">e,12-d1", { metaGame: META_CARNAC })
    ).toEqual({
      valid: true,
      partial: false,
    });
  });
});

describe("applyExplorationMove", () => {
  it("replays tip-only moves with partial trusted application", () => {
    const engine = mockTipEngine();
    expect(() =>
      applyExplorationMove(engine, ">e", { metaGame: META_CARNAC })
    ).not.toThrow();
    expect(engine.last).toBe(">e");
  });

  it("replays complete tips as full moves", () => {
    const engine = mockTipEngine();
    applyExplorationMove(engine, ">e,12-d1", { metaGame: META_CARNAC });
    expect(engine.last).toBe(">e,12-d1");
  });
});

describe("filterPersistableExplorationTree", () => {
  it("drops partial tips but keeps complete branches", () => {
    const engine = mockTipEngine();
    const filtered = filterPersistableExplorationTree(
      engine,
      [
        { move: ">e", children: [] },
        { move: ">e,12-d1", children: [] },
        { move: ">w,12-d1", children: [] },
      ],
      META_CARNAC
    );
    expect(filtered.map((c) => c.move)).toEqual([">e,12-d1", ">w,12-d1"]);
  });

  it("wraps single-player simultaneous moves before probing", () => {
    const engine = mockEntropySimEngine();
    const filtered = filterPersistableExplorationTree(
      engine,
      [
        { move: "d5", children: [] },
        { move: "d5-e4", children: [] },
        { move: "d4", children: [] },
      ],
      entropySimContext
    );
    expect(filtered.map((c) => c.move)).toEqual(["d5-e4", "d4"]);
  });
});

describe("simultaneous exploration moves", () => {
  it("treats partial order source as partial with player-aware validation", () => {
    const engine = mockEntropySimEngine();
    expect(isPartialExplorationMove(engine, "d5", entropySimContext)).toBe(
      true
    );
    expect(isPartialExplorationMove(engine, "d5,", entropySimContext)).toBe(
      true
    );
    expect(isPersistableExplorationMove(engine, "d5", entropySimContext)).toBe(
      false
    );
  });

  it("treats complete order and chaos placements as persistable", () => {
    const engine = mockEntropySimEngine();
    expect(isPartialExplorationMove(engine, "d5-e4", entropySimContext)).toBe(
      false
    );
    expect(
      isPersistableExplorationMove(engine, "d5-e4", entropySimContext)
    ).toBe(true);
    expect(isPersistableExplorationMove(engine, "d4", entropySimContext)).toBe(
      true
    );
  });

  it("applies wrapped simultaneous moves to the engine", () => {
    const engine = mockEntropySimEngine();
    applyExplorationMove(engine, "d4", entropySimContext);
    expect(engine.last).toBe("d4,");
  });
});
