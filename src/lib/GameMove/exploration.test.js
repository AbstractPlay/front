import { GameNode } from "../../components/GameMove/GameTree";

jest.mock("../api", () => ({
  callAuthApi: jest.fn(),
}));

jest.mock("@abstractplay/gameslib", () => ({
  GameFactory: (_metaGame, state) => {
    const legal = [">e,12-d1", ">w,12-d1"];
    return {
      stack: JSON.parse(state).stack,
      currplayer: 1,
      moves: () => legal,
      sameMove: (a, b) => a === b,
      validateMove(m) {
        if (m === ">e") return { valid: true, complete: 0, canrender: true };
        if (legal.includes(m)) return { valid: true, complete: 1 };
        return { valid: false };
      },
      move(m, { partial = false } = {}) {
        if (!partial && m === ">e") throw new Error("VALIDATION_GENERAL");
      },
      serialize: () => state,
      cheapSerialize: () => state,
      load: jest.fn(),
      gameover: false,
      winner: [],
    };
  },
}));

import { mergeExploration } from "./exploration";

describe("mergeExploration", () => {
  const game = {
    id: "test",
    metaGame: "carnac",
    state: JSON.stringify({ stack: [{}, {}] }),
    gameOver: false,
  };

  it("replays partial tip-only stored branches without throwing", () => {
    const exploration = [
      new GameNode(null, "", JSON.stringify({ stack: [{}] }), 0),
      new GameNode(null, "12-a1", null, 1),
    ];
    expect(() =>
      mergeExploration(
        game,
        exploration,
        [{ move: 2, tree: [{ move: ">e", children: [] }] }],
        null,
        () => {},
        { current: "" }
      )
    ).not.toThrow();
    expect(exploration[1].children).toHaveLength(1);
    expect(exploration[1].children[0].move).toBe(">e");
  });

  it("merges valid stored branches", () => {
    const exploration = [
      new GameNode(null, "", JSON.stringify({ stack: [{}] }), 0),
      new GameNode(null, "12-a1", null, 1),
    ];
    mergeExploration(
      game,
      exploration,
      [{ move: 2, tree: [{ move: ">e,12-d1", children: [] }] }],
      null,
      () => {},
      { current: "" }
    );
    expect(exploration[1].children).toHaveLength(1);
    expect(exploration[1].children[0].move).toBe(">e,12-d1");
  });
});
