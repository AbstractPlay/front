import { expect } from "chai";
import { vi } from "vitest";
import { buildFrameRenderRep } from "./buildFrameRenderReps";

const renderOptsLog = vi.hoisted(() => []);

vi.mock("../displaySettings.js", () => ({
  buildRenderDisplayOpts: (_meta, _display, extras) => {
    renderOptsLog.push(extras);
    return extras;
  },
}));

vi.mock("../resolveRenderLabels", () => ({
  resolveRenderLabels: (rep) => rep,
}));

vi.mock("@abstractplay/gameslib", () => ({
  GameFactory: (_meta, state) => ({
    render: (opts) => {
      renderOptsLog.push({ renderCall: opts });
      return { renderer: "plain" };
    },
  }),
}));

describe("buildFrameRenderRep", () => {
  beforeEach(() => {
    renderOptsLog.length = 0;
  });

  it("passes omniscient render when session game is over", () => {
    const rep = buildFrameRenderRep({
      exploration: [],
      game: {
        metaGame: "test",
        me: 0,
        gameEnded: 1791206378905,
        players: [{ id: "p1" }],
      },
      focus: { moveNumber: 0, exPath: [] },
      getFocusNode: () => ({ state: "{}" }),
      players: [{ id: "p1" }],
      users: {},
      display: [],
    });

    expect(rep).to.deep.equal({ renderer: "plain" });
    expect(renderOptsLog[0]).to.deep.equal({
      perspective: 1,
      omniscient: true,
    });
  });

  it("uses seat perspective only for in-progress sessions", () => {
    buildFrameRenderRep({
      exploration: [],
      game: {
        metaGame: "test",
        me: 1,
        gameOver: false,
        players: [],
      },
      focus: { moveNumber: 0, exPath: [] },
      getFocusNode: () => ({ state: "{}" }),
      display: [],
    });

    expect(renderOptsLog[0]).to.deep.equal({ perspective: 2 });
  });
});
