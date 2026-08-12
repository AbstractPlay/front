import { vi } from "vitest";
import { GameNode } from "../../components/GameMove/GameTree";
import { processNewMove } from "./gameStuff";

vi.mock("react-toastify", () => ({
  toast: vi.fn(),
}));

vi.mock("../../stores", () => ({
  useStore: {
    getState: () => ({ users: {} }),
  },
}));

vi.mock("./exploration", () => ({
  isExplorer: () => false,
  canExploreMove: () => false,
  setCanPublish: vi.fn(),
  setURL: vi.fn(),
  getFocusNode: () => ({ state: "{}" }),
  fixMoveOutcomes: vi.fn(),
  saveExploration: vi.fn(),
}));

vi.mock("./misc", () => ({
  replaceNames: (render) => render,
  setStatus: vi.fn(),
}));

vi.mock("@abstractplay/gameslib", () => ({
  GameFactory: () => ({
    validateMove(m) {
      if (m === "") {
        return { valid: true, complete: -1, canrender: true };
      }
      if (m === "f7") {
        return { valid: true, complete: -1, canrender: true };
      }
      return { valid: false };
    },
    move(m) {
      if (m === "") {
        throw new Error("The algebraic notation is invalid: ");
      }
    },
    render: () => ({}),
    cheapSerialize: () => ({}),
    moves: () => [],
    state: () => ({}),
  }),
  gameinfo: {
    get: () => ({ flags: [] }),
  },
}));

describe("processNewMove", () => {
  const gameState = "{}";
  const game = {
    metaGame: "pinch",
    me: 0,
    noMoves: false,
    numPlayers: 2,
    players: [
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
    ],
    gameOver: false,
    simultaneous: false,
  };
  const exploration = [new GameNode(null, "", gameState, 0)];
  const focus = { moveNumber: 0, exPath: [], canExplore: false };

  function runProcessNewMove(newmove, partialMoveRenderRef) {
    const gameRef = { current: game };
    const movesRef = { current: [] };
    const statusRef = { current: {} };
    const errorMessageRef = { current: "" };
    const engineRef = { current: {} };
    let moveState = null;
    let errorShown = false;

    processNewMove(
      newmove,
      null,
      { id: "p1" },
      focus,
      gameRef,
      movesRef,
      statusRef,
      exploration,
      errorMessageRef,
      partialMoveRenderRef,
      vi.fn(),
      engineRef,
      (v) => {
        if (v) errorShown = true;
      },
      vi.fn(),
      (m) => {
        moveState = m;
      },
      null,
      vi.fn(),
      (key) => key
    );

    return { moveState, errorShown };
  }

  it("clears a partial render without calling doView on empty canrender move", () => {
    const partialMoveRenderRef = { current: false };

    const partial = runProcessNewMove(
      {
        valid: true,
        complete: -1,
        canrender: true,
        move: "f7",
        rendered: "",
      },
      partialMoveRenderRef
    );
    expect(partial.errorShown).toBe(false);
    expect(partialMoveRenderRef.current).toBe(true);

    const cleared = runProcessNewMove(
      {
        valid: true,
        complete: -1,
        canrender: true,
        move: "",
        rendered: "f7",
      },
      partialMoveRenderRef
    );

    expect(cleared.errorShown).toBe(false);
    expect(partialMoveRenderRef.current).toBe(false);
    expect(cleared.moveState).toEqual(
      expect.objectContaining({ move: "", rendered: "" })
    );
  });
});
