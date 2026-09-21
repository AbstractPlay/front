import { vi } from "vitest";
import { GameNode } from "../../components/Lab/GameTree";
import { processNewMove } from "./gameStuff";

vi.mock("react-toastify", () => ({
  toast: vi.fn(),
}));

vi.mock("../../stores", () => ({
  useStore: {
    getState: () => ({ users: {} }),
  },
}));

vi.mock("./exploration", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getFocusNode: (exploration, _game, focus) => exploration[focus.moveNumber],
    saveLabExploration: vi.fn(),
  };
});

vi.mock("./misc", () => ({
  resolveRenderLabels: (render) => render,
  setStatus: vi.fn(),
}));

vi.mock("../engineMoveResults", () => ({
  buildEngineMoveResults: vi.fn(() => []),
}));

const CMD_PARAMETERS = "The wrong number of parameters were provided.";
const SACRIFICE_MOVE = "sacrifice g2 Eyuf";
const WIRE_MOVE = "a6-b5";
const CANONICAL_MOVE = "a6-b5(xc4)";

vi.mock("@abstractplay/gameslib", () => {
  function createEngine() {
    return {
      validateMove(m) {
        if (m === SACRIFICE_MOVE) {
          return { valid: true, complete: -1, canrender: true };
        }
        if (m === WIRE_MOVE) {
          return { valid: true, complete: 1 };
        }
        if (m === "") {
          return { valid: true, complete: -1 };
        }
        return { valid: false };
      },
      move(m, { partial = false } = {}) {
        if (!partial && m === SACRIFICE_MOVE) {
          const err = new Error(CMD_PARAMETERS);
          err.name = "UserFacingError";
          err.client = CMD_PARAMETERS;
          throw err;
        }
        this.last = m;
        this.lastPartial = partial;
        if (!partial && m === WIRE_MOVE) {
          this.lastmove = CANONICAL_MOVE;
        }
      },
      render: () => ({}),
      serialize: () => "{}",
      currplayer: 1,
      gameover: false,
      winner: [],
      sameMove: (a, b) => a === b,
      moves: () => [],
      state: () => ({}),
      cheapSerialize: () => ({}),
      clone() {
        return createEngine();
      },
    };
  }
  return {
    GameFactory: () => createEngine(),
    gameinfo: {
      get: () => ({ flags: [] }),
    },
  };
});

describe("processNewMove", () => {
  const game = {
    metaGame: "homeworlds",
    noMoves: false,
    numPlayers: 2,
    players: [
      { id: "lab-p0", name: "Player 1" },
      { id: "lab-p1", name: "Player 2" },
    ],
    gameOver: false,
    simultaneous: false,
  };
  const exploration = [new GameNode(null, "", "{}", 0)];
  const focus = { moveNumber: 0, exPath: [], canExplore: true };

  function runProcessNewMove(newmove, partialMoveRenderRef, explorationNodes = exploration) {
    const gameRef = { current: game };
    const movesRef = { current: [] };
    const statusRef = { current: {} };
    const errorMessageRef = { current: "" };
    const engineRef = { current: {} };
    let errorShown = false;

    processNewMove(
      newmove,
      focus,
      gameRef,
      movesRef,
      statusRef,
      explorationNodes,
      errorMessageRef,
      partialMoveRenderRef,
      vi.fn(),
      engineRef,
      (v) => {
        if (v) errorShown = true;
      },
      vi.fn(),
      vi.fn(),
      null,
      (key) => key
    );

    return { errorShown, engineRef };
  }

  it("uses partial apply when Complete move forces complete:1 but engine still returns complete:-1", () => {
    const partialMoveRenderRef = { current: false };

    const { errorShown, engineRef } = runProcessNewMove(
      {
        valid: true,
        complete: 1,
        canrender: true,
        move: SACRIFICE_MOVE,
        rendered: "",
      },
      partialMoveRenderRef
    );

    expect(errorShown).toBe(false);
    expect(partialMoveRenderRef.current).toBe(true);
    expect(engineRef.current.last).toBe(SACRIFICE_MOVE);
    expect(engineRef.current.lastPartial).toBe(true);
  });

  it("records engine lastmove on the spine after a full apply", () => {
    const partialMoveRenderRef = { current: false };
    const nodes = [new GameNode(null, "", "{}", 0)];

    runProcessNewMove(
      {
        valid: true,
        complete: 1,
        move: WIRE_MOVE,
        rendered: "",
      },
      partialMoveRenderRef,
      nodes
    );

    expect(nodes).toHaveLength(2);
    expect(nodes[1].move).toBe(CANONICAL_MOVE);
    expect(partialMoveRenderRef.current).toBe(false);
  });
});
