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
        cheapSerialize() {
          return JSON.stringify({
            ...parsed,
            stack: this.stack,
            gameover: this.gameover,
            winner: this.winner,
          });
        },
        validateMove(m) {
          if (m === "alt") return { valid: true, complete: 1 };
          return { valid: false };
        },
        move(m) {
          if (m === "alt") this.stack.push(99);
        },
      };
      return engine;
    },
  };
});

describe("createEngineAtFocus", () => {
  beforeEach(() => {
    factoryLog.length = 0;
  });

  it("main line factories from hydrated spine state, and keeps stored state", () => {
    const live = stateJson("live", [10, 20, 30], { gameover: true, winner: [1] });
    const stored = stateJson("stored", [4, 5]);
    const game = { metaGame: "test", state: live };
    const exploration = [
      new GameNode(null, "", null, 0),
      new GameNode(null, "m1", stored, 0),
    ];
    const focus = { moveNumber: 1, exPath: [] };

    const engine = createEngineAtFocus(game, exploration, focus);

    expect(factoryLog[factoryLog.length - 1].state).to.equal(stored);
    expect(engine.stack).to.deep.equal([4, 5]);
  });

  it("main line hydrates a null spine node from live game.state", () => {
    const live = stateJson("live", [10, 20, 30], { gameover: true, winner: [1] });
    const game = { metaGame: "test", state: live };
    const exploration = [
      new GameNode(null, "", null, 0),
      new GameNode(null, "m1", null, 0),
    ];
    const focus = { moveNumber: 1, exPath: [] };

    const engine = createEngineAtFocus(game, exploration, focus);

    const hydrated = JSON.parse(exploration[1].state);
    expect(hydrated.stack).to.deep.equal([10, 20]);
    expect(hydrated.gameover).to.be.false;
    expect(engine.stack).to.deep.equal([10, 20]);
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

  it("hydrates a branch child once when its state is missing", () => {
    const live = stateJson("live", [1, 2]);
    const game = { metaGame: "test", state: live };
    const exploration = [
      new GameNode(null, "", null, 0),
      new GameNode(null, "m1", null, 0),
    ];
    exploration[1].children.push(new GameNode(exploration[1], "alt", null, 0));
    const focus = { moveNumber: 1, exPath: [0] };

    const engine = createEngineAtFocus(game, exploration, focus);

    expect(exploration[1].children[0].state).to.be.a("string");
    expect(engine.stack).to.deep.equal([1, 2, 99]);
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
