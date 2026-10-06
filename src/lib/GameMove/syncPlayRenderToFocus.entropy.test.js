import { expect } from "chai";
import { vi } from "vitest";
import { GameFactory } from "@abstractplay/gameslib";
import { GameNode } from "../../components/GameMove/GameTree.js";
import { ENTROPY_ORDER_STATE } from "./fixtures/entropy.js";
import { syncPlayRenderToFocus } from "./gameStuff.js";

vi.mock("../../stores", () => ({
  useStore: {
    getState: () => ({ users: {} }),
  },
}));

vi.mock("./misc", () => ({
  resolveRenderLabels: (render) => render,
  setStatus: vi.fn(),
}));

describe("syncPlayRenderToFocus entropy partial round", () => {
  it("sets partialMoveRenderRef when waiting on opponent", () => {
    const engine0 = GameFactory("entropy", ENTROPY_ORDER_STATE);
    const state = engine0.cheapSerialize();
    const exploration = [
      new GameNode(null, "", state, 0),
      new GameNode(state, engine0.lastmove, null, 0),
    ];
    exploration[1].state = state;

    const game = {
      metaGame: "entropy",
      state,
      simultaneous: true,
      numPlayers: 2,
      partialMove: "d5-d4,",
      toMove: [false, true],
      me: 0,
      players: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      stackExpanding: false,
      noMoves: true,
    };
    const focus = { moveNumber: 1, exPath: [], canExplore: false };
    const partialMoveRenderRef = { current: false };
    const engineRef = { current: null };
    let renderOut = null;

    syncPlayRenderToFocus(game, exploration, focus, {
      partialMoveRenderRef,
      engineRef,
      renderrepSetter: (r) => {
        renderOut = r;
      },
      movesRef: { current: null },
      statusRef: { current: {} },
      display: [],
    });

    expect(partialMoveRenderRef.current).to.be.true;
    expect(renderOut).to.exist;
    expect(game.moveResults?.length).to.be.greaterThan(0);
    expect(game.moveResults.every((r) => r.log.length > 0)).to.be.true;
    const bare = GameFactory("entropy", state);
    bare.render({ perspective: 1 });
    expect(JSON.stringify(renderOut)).to.not.equal(
      JSON.stringify(bare.render({ perspective: 1 }))
    );
  });
});
