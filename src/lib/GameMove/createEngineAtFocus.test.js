import { expect } from "chai";
import { vi } from "vitest";
import { GameNode } from "../../components/GameMove/GameTree";
import {
  createEngineAtFocus,
  invalidateExplorationSpineStates,
} from "./exploration";

const factoryLog = vi.hoisted(() => []);

function stateJson(id, stack, extras = {}) {
  return JSON.stringify({ id, stack, ...extras });
}

vi.mock("../api", () => ({
  callAuthApi: vi.fn(),
}));

vi.mock("@abstractplay/gameslib", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    GameFactory: (_metaGame, state) => {
      const parsed = JSON.parse(state);
      factoryLog.push({ state });
      const engine = {
        stack: [...parsed.stack],
        gameover: parsed.gameover ?? false,
        winner: parsed.winner ?? [],
        load: vi.fn(),
        cheapSerialize: () => state,
      };
      return engine;
    },
  };
});

describe("createEngineAtFocus", () => {
  beforeEach(() => {
    factoryLog.length = 0;
  });

  it("main line uses live game.state, not cached spine node.state", () => {
    const live = stateJson("live", [10, 20, 30], { gameover: true, winner: [1] });
    const stale = stateJson("stale", [99]);
    const game = { metaGame: "test", state: live };
    const exploration = [
      new GameNode(null, "", stale, 0),
      new GameNode(null, "m1", stale, 0),
    ];
    const focus = { moveNumber: 1, exPath: [] };

    const engine = createEngineAtFocus(game, exploration, focus);

    expect(factoryLog[0].state).to.equal(live);
    expect(engine.stack).to.deep.equal([10, 20]);
    expect(engine.gameover).to.be.false;
    expect(engine.winner).to.deep.equal([]);
    expect(engine.load).to.have.been.calledOnce;
  });

  it("exploration branch uses focus node state", () => {
    const live = stateJson("live", [1, 2, 3]);
    const branch = stateJson("branch", [7, 8]);
    const game = { metaGame: "test", state: live };
    const exploration = [
      new GameNode(null, "", null, 0),
      new GameNode(null, "m1", null, 0),
    ];
    exploration[1].children.push(
      new GameNode(exploration[1], "alt", branch, 0)
    );
    const focus = { moveNumber: 1, exPath: [0] };

    const engine = createEngineAtFocus(game, exploration, focus);

    expect(factoryLog[factoryLog.length - 1].state).to.equal(branch);
    expect(engine.stack).to.deep.equal([7, 8]);
  });
});

describe("invalidateExplorationSpineStates", () => {
  it("nulls cached state on every spine node", () => {
    const nodes = [
      new GameNode(null, "", "a", 0),
      new GameNode(null, "m", "b", 0),
    ];
    invalidateExplorationSpineStates(nodes);
    expect(nodes[0].state).to.be.null;
    expect(nodes[1].state).to.be.null;
  });
});
