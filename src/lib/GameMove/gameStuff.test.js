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
  getFocusNode: (exploration, _game, focus) => exploration[focus.moveNumber],
  fixMoveOutcomes: vi.fn(),
  saveExploration: vi.fn(),
}));

vi.mock("./misc", () => ({
  replaceNames: (render) => render,
  setStatus: vi.fn(),
}));

vi.mock("@abstractplay/gameslib", () => ({
  GameFactory: () => ({
    validateMove(m, player) {
      if (player === 1) {
        if (m === "d5") {
          return { valid: true, complete: -1, canrender: true };
        }
        if (m === "d5-e4") {
          return { valid: true, complete: 1 };
        }
      }
      if (m === "") {
        return { valid: true, complete: -1, canrender: true };
      }
      if (m === "f7") {
        return { valid: true, complete: -1, canrender: true };
      }
      return { valid: false };
    },
    move(m, opts = {}) {
      if (m === "" && !opts.partial && !opts.emulation) {
        throw new Error("The algebraic notation is invalid: ");
      }
    },
    render: () => ({}),
    cheapSerialize: () => ({}),
    serialize: () => ({}),
    currplayer: 1,
    gameover: false,
    winner: [],
    sameMove: (a, b) => a === b,
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

  function runProcessNewMove(
    newmove,
    partialMoveRenderRef,
    renderrepSetter = vi.fn()
  ) {
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
      renderrepSetter,
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

  it("re-renders on canrender move with render opts but empty move string", () => {
    const renderrepSetter = vi.fn();
    const partialMoveRenderRef = { current: false };

    const { errorShown } = runProcessNewMove(
      {
        valid: true,
        complete: -1,
        canrender: true,
        move: "",
        rendered: "",
        opts: { hideLayer: 1 },
      },
      partialMoveRenderRef,
      renderrepSetter
    );

    expect(errorShown).toBe(false);
    expect(renderrepSetter).toHaveBeenCalledTimes(1);
    expect(partialMoveRenderRef.current).toBe(true);
  });

  it("keeps exPath empty for simultaneous partial order moves", () => {
    const simGame = {
      ...game,
      metaGame: "entropy",
      simultaneous: true,
    };
    let simFocus = { moveNumber: 0, exPath: [], canExplore: true };
    const partialMoveRenderRef = { current: false };

    processNewMove(
      {
        valid: true,
        complete: -1,
        canrender: true,
        move: "d5",
        rendered: "",
      },
      null,
      { id: "p1" },
      simFocus,
      { current: simGame },
      { current: [] },
      { current: {} },
      exploration,
      { current: "" },
      partialMoveRenderRef,
      vi.fn(),
      { current: {} },
      vi.fn(),
      (focus) => {
        simFocus = focus;
      },
      vi.fn(),
      null,
      vi.fn(),
      (key) => key
    );

    expect(simFocus.exPath).toEqual([]);
    expect(partialMoveRenderRef.current).toBe(true);

    processNewMove(
      {
        valid: true,
        complete: 1,
        move: "d5-e4",
        rendered: "",
      },
      null,
      { id: "p1" },
      simFocus,
      { current: simGame },
      { current: [] },
      { current: {} },
      exploration,
      { current: "" },
      partialMoveRenderRef,
      vi.fn(),
      { current: {} },
      vi.fn(),
      (focus) => {
        simFocus = focus;
      },
      vi.fn(),
      null,
      vi.fn(),
      (key) => key
    );

    expect(simFocus.exPath).toEqual([0]);
    expect(partialMoveRenderRef.current).toBe(false);
  });
});
