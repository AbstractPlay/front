import { expect } from "chai";
import { vi } from "vitest";
import { GameNode } from "../../components/GameMove/GameTree";
import { syncPlayRenderToFocus } from "./gameStuff";

const renderOptsLog = vi.hoisted(() => []);

vi.mock("../../stores", () => ({
  useStore: {
    getState: () => ({ users: {} }),
  },
}));

vi.mock("./misc", () => ({
  resolveRenderLabels: (render) => render,
  setStatus: vi.fn(),
}));

vi.mock("../displaySettings.js", () => ({
  buildRenderDisplayOpts: (_meta, display, { perspective }) => {
    renderOptsLog.push({ display, perspective });
    return { perspective };
  },
}));

vi.mock("../api", () => ({
  callAuthApi: vi.fn(),
}));

vi.mock("@abstractplay/gameslib", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    GameFactory: (_meta, state) => {
      const parsed = JSON.parse(state);
      return {
        stack: [...parsed.stack],
        gameover: false,
        winner: [],
        load: vi.fn(),
        cheapSerialize: () => state,
        render: (opts) => {
          renderOptsLog.push({ renderCall: opts });
          return parsed.renderResult ?? { renderer: "plain" };
        },
        moves: () => ["a1"],
        validateMove: () => ({ valid: true, complete: -1 }),
      };
    },
  };
});

describe("syncPlayRenderToFocus", () => {
  beforeEach(() => {
    renderOptsLog.length = 0;
  });

  it("uses seat 1 perspective for spectators (me === -1)", () => {
    const state = JSON.stringify({ stack: [1], renderResult: { renderer: "plain" } });
    const game = {
      metaGame: "test",
      state,
      me: -1,
      players: [],
      noMoves: true,
      stackExpanding: false,
    };
    const exploration = [new GameNode(null, "", null, 0)];
    const focus = { moveNumber: 0, exPath: [], canExplore: false };
    const renderrepSetter = vi.fn();

    syncPlayRenderToFocus(game, exploration, focus, {
      partialMoveRenderRef: { current: false },
      engineRef: { current: null },
      renderrepSetter,
      movesRef: { current: null },
      statusRef: { current: {} },
      display: [],
    });

    expect(renderOptsLog[0].perspective).to.equal(1);
  });

  it("stackExpanding follows the last rep when render returns an array", () => {
    const state = JSON.stringify({
      stack: [1],
      renderResult: [
        { renderer: "plain" },
        { renderer: "stacking-expanding" },
      ],
    });
    const game = {
      metaGame: "test",
      state,
      me: 0,
      players: [{ id: "p1" }],
      noMoves: true,
      stackExpanding: true,
    };
    const exploration = [new GameNode(null, "", null, 0)];
    const focus = { moveNumber: 0, exPath: [], canExplore: false };

    syncPlayRenderToFocus(game, exploration, focus, {
      partialMoveRenderRef: { current: false },
      engineRef: { current: null },
      renderrepSetter: vi.fn(),
      movesRef: { current: null },
      statusRef: { current: {} },
      display: [],
    });

    expect(game.stackExpanding).to.be.true;

    game.stackExpanding = true;
    const stateSingle = JSON.stringify({
      stack: [1],
      renderResult: { renderer: "plain" },
    });
    game.state = stateSingle;

    syncPlayRenderToFocus(game, exploration, focus, {
      partialMoveRenderRef: { current: false },
      engineRef: { current: null },
      renderrepSetter: vi.fn(),
      movesRef: { current: null },
      statusRef: { current: {} },
      display: [],
    });

    expect(game.stackExpanding).to.be.false;
  });
});
