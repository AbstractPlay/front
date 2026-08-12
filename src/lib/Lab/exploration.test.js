import { GameNode } from "../../components/Lab/GameTree";
import {
  shouldExtendMainLine,
  shouldReplayAlongMainLine,
  createSpineNode,
  serializeSessionExploration,
  normalizeSessionExploration,
  getMainLineTipState,
  deleteSpineEntry,
  recalculateLabOutcomes,
  restoreSessionExploration,
} from "./exploration";

jest.mock("@abstractplay/gameslib", () => ({
  GameFactory: (_metaGame, state) => {
    const isTerminal =
      typeof state === "string" && state.includes('"terminal":true');
    return {
      sameMove: (a, b) => a === b,
      move: () => {},
      validateMove: () => ({ valid: true, complete: 1 }),
      moves: () => [],
      serialize: () => "{}",
      cheapSerialize: () => "{}",
      stack: { pop: () => {}, length: 1, slice: () => [] },
      load: () => {},
      gameover: isTerminal,
      winner: isTerminal ? [1] : [],
      currplayer: 1,
    };
  },
}));

function makeSpine(moves) {
  const nodes = [new GameNode(null, "", null, 0)];
  for (let i = 0; i < moves.length; i++) {
    nodes.push(
      new GameNode(null, moves[i], JSON.stringify({ ply: i + 1 }), i % 2)
    );
  }
  return nodes;
}

describe("shouldExtendMainLine", () => {
  it("is true at the spine tip with empty exPath", () => {
    const exploration = makeSpine(["a1"]);
    expect(
      shouldExtendMainLine(exploration, { moveNumber: 1, exPath: [] })
    ).toBe(true);
  });

  it("is false when exploring a variation", () => {
    const exploration = makeSpine(["a1"]);
    expect(
      shouldExtendMainLine(exploration, { moveNumber: 1, exPath: [0] })
    ).toBe(false);
  });
});

describe("shouldReplayAlongMainLine", () => {
  it("matches the next spine move", () => {
    const exploration = makeSpine(["a1", "b2"]);
    const engine = { sameMove: (a, b) => a === b };
    expect(
      shouldReplayAlongMainLine(
        exploration,
        { moveNumber: 0, exPath: [] },
        engine,
        "a1"
      )
    ).toBe(true);
  });
});

describe("serializeSessionExploration", () => {
  it("returns one slot per spine node after extension", () => {
    const exploration = makeSpine(["homeworld", "build"]);
    exploration[0].children.push(
      new GameNode(exploration[0], "alt", "{}", 1)
    );
    const serialized = serializeSessionExploration(exploration);
    expect(serialized).toHaveLength(3);
    expect(serialized[0]).toHaveLength(1);
    expect(serialized[1]).toBeNull();
    expect(serialized[2]).toBeNull();
  });
});

describe("getMainLineTipState", () => {
  it("uses the spine tip node state, not a longer game.state", () => {
    const nodes = makeSpine(["only"]);
    const game = {
      metaGame: "tictactoe",
      state: JSON.stringify({ stack: [{}, {}, {}] }),
    };
    nodes[1].state = JSON.stringify({ stack: [{}, {}] });
    expect(getMainLineTipState(nodes, game)).toBe(nodes[1].state);
  });
});

describe("normalizeSessionExploration", () => {
  it("unwraps a single-slot linear chain to full spine length", () => {
    const history = makeSpine(["m1", "m2"]);
    const malformed = [
      [
        {
          move: "m1",
          children: [{ move: "m2", children: [], textComment: "end" }],
        },
      ],
    ];
    const normalized = normalizeSessionExploration(history, malformed);
    expect(normalized).toHaveLength(3);
    expect(normalized[0]).toBeNull();
    expect(normalized[1]).toBeNull();
    expect(normalized[2]).toBeNull();
    expect(history[2].textComment).toBe("end");
  });

  it("unwraps a malformed tree with sibling branches at a fork", () => {
    const history = makeSpine([
      "build g north",
      "build g south",
      "trade g1 north y",
    ]);
    const malformed = [
      [
        {
          move: "build G North",
          children: [
            {
              move: "build G South",
              children: [
                {
                  move: "move G1 North South ",
                  children: [{ move: "trade G3 South B", children: [] }],
                  textComment: "variation",
                },
                {
                  move: "trade G1 North Y",
                  children: [{ move: "build Y South", children: [] }],
                },
              ],
            },
          ],
        },
      ],
    ];
    const normalized = normalizeSessionExploration(history, malformed);
    expect(normalized).toHaveLength(4);
    expect(normalized[2]).toHaveLength(1);
    expect(normalized[2][0].move).toBe("move G1 North South ");
    expect(normalized[2][0].textComment).toBe("variation");
  });

  it("restores side branches from a normalized export", () => {
    const history = makeSpine(["m1", "m2"]);
    history.push(new GameNode(null, "m3", "{}", 0));
    const malformed = [
      [
        {
          move: "m1",
          children: [
            { move: "alt", children: [] },
            { move: "m2", children: [{ move: "m3", children: [] }] },
          ],
        },
      ],
    ];
    const normalized = normalizeSessionExploration(history, malformed);
    restoreSessionExploration(history, "tictactoe", { state: "{}" }, normalized);
    expect(history[1].children).toHaveLength(1);
    expect(history[1].children[0].move).toBe("alt");
    expect(history).toHaveLength(4);
    expect(history[3].move).toBe("m3");
  });
});

describe("recalculateLabOutcomes", () => {
  it("clears stale outcomes after spine truncate before game over", () => {
    const exploration = makeSpine(["a", "b", "c"]);
    exploration[2].state = '{"ply":3,"terminal":true}';
    exploration[0].outcome = 0;
    exploration[1].outcome = 0;
    exploration[2].outcome = 0;
    const game = { metaGame: "test", simultaneous: false, gameOver: true };

    deleteSpineEntry(exploration, 1);
    recalculateLabOutcomes(exploration, game, 0);

    expect(exploration).toHaveLength(1);
    expect(exploration[0].outcome).toBe(-1);
    expect(game.gameOver).toBe(false);
  });

  it("keeps engine-terminal variation outcomes after recalculation", () => {
    const exploration = makeSpine(["a", "b"]);
    exploration[2].state = '{"ply":2,"terminal":true}';
    const varNode = new GameNode(
      exploration[0],
      "alt",
      '{"ply":1,"terminal":true}',
      1
    );
    exploration[0].children.push(varNode);

    const game = { metaGame: "test", simultaneous: false, gameOver: false };
    recalculateLabOutcomes(exploration, game, 0);

    expect(varNode.outcome).toBe(0);
    expect(exploration[2].outcome).toBe(0);
    expect(game.gameOver).toBe(true);
  });
});

describe("deleteSpineEntry", () => {
  it("promotes the first forward branch when deleting a spine node", () => {
    const exploration = makeSpine(["a", "b", "c"]);
    const branchA = new GameNode(exploration[1], "branchA", "{}", 0);
    const branchB = new GameNode(exploration[1], "branchB", "{}", 0);
    exploration[1].children.push(branchA, branchB);

    const { focus } = deleteSpineEntry(exploration, 1);
    expect(exploration).toHaveLength(2);
    expect(exploration[1].move).toBe("branchA");
    expect(exploration[1].children).toHaveLength(1);
    expect(exploration[1].children[0].move).toBe("branchB");
    expect(focus).toEqual({ moveNumber: 1, exPath: [] });
  });

  it("focuses the parent when deleting a spine node with no branches", () => {
    const exploration = makeSpine(["a", "b"]);
    const { focus } = deleteSpineEntry(exploration, 1);
    expect(exploration).toHaveLength(1);
    expect(focus).toEqual({ moveNumber: 0, exPath: [] });
  });
});

describe("createSpineNode", () => {
  it("creates a parentless spine node from an engine snapshot", () => {
    const game = { simultaneous: false };
    const engine = {
      gameover: false,
      currplayer: 2,
      winner: [],
      serialize: () => '{"ply":1}',
    };
    const node = createSpineNode("x", engine, game);
    expect(node.parent).toBeNull();
    expect(node.move).toBe("x");
    expect(node.state).toBe('{"ply":1}');
    expect(node.toMove).toBe(1);
  });
});
