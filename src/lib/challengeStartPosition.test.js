import { describe, it, expect } from "vitest";
import { GameFactory } from "@abstractplay/gameslib";
import {
  buildStartPositionPayload,
  buildStartPositionFromLabSession,
  buildStartPositionFromGameMoveSession,
  isStartPositionChallengeEligible,
} from "./challengeStartPosition";

describe("challengeStartPosition", () => {
  it("buildStartPositionPayload wraps state", () => {
    const state = '{"game":"saltire"}';
    expect(buildStartPositionPayload(state)).toEqual({
      startPosition: { state },
    });
  });

  it("isStartPositionChallengeEligible matches teaching rules for saltire 2P", () => {
    expect(isStartPositionChallengeEligible("saltire", 2, [])).toBe(true);
    expect(isStartPositionChallengeEligible("saltire", 3, [])).toBe(false);
  });

  it("buildStartPositionFromLabSession uses the selected main-line tip", () => {
    const engine = GameFactory("saltire", undefined, []);
    const opening = engine.serialize();
    engine.move(engine.moves()[0]);
    const after = engine.serialize();
    const game = { metaGame: "saltire", selectedVariants: [] };
    const nodes = [
      { state: opening, children: [{ move: "x", children: [] }] },
      { state: after, children: [] },
    ];
    const draft = buildStartPositionFromLabSession({
      game,
      nodes,
      focus: { moveNumber: 1, exPath: [] },
    });
    expect(draft.metaGame).toBe("saltire");
    expect(draft.state).toBe(after);
    expect(draft.playerCount).toBe(2);
  });
});

describe.each([
  ["Lab", buildStartPositionFromLabSession],
  ["Game Move", buildStartPositionFromGameMoveSession],
])("%s start-position selection", (_name, buildStartPosition) => {
  it("uses an earlier main-line position, hydrating its snapshot", () => {
    const engine = GameFactory("saltire", undefined, []);
    engine.move(engine.moves()[0]);
    const selected = engine.serialize();
    engine.move(engine.moves()[0]);
    const tip = engine.serialize();
    const nodes = [
      { state: null, children: [] },
      { state: null, children: [] },
      { state: tip, children: [] },
    ];
    const draft = buildStartPosition({
      game: { metaGame: "saltire", state: tip, selectedVariants: [] },
      nodes,
      focus: { moveNumber: 1, exPath: [] },
    });
    const actual = GameFactory("saltire", draft.state);
    const expected = GameFactory("saltire", selected);
    expect(actual.stack).toHaveLength(2);
    expect(actual.board).toEqual(expected.board);
    expect(actual.currplayer).toBe(expected.currplayer);
  });

  it("uses the nested Arimaa exploration branch from the selected focus", () => {
    const main = GameFactory("arimaa", undefined, ["free"]);
    const opening = main.serialize();
    main.move("Re1, Ee2, Md2, Hc2, Hb2, Da2, Da1, Cc1, Cb1");
    const mainGold = main.serialize();
    main.move(
      "ra8, rb8, rc8, rd8, re8, rf8, rg8, rh8, rh7, rg7, rf7, re7, rd7, rc7, rb7, ra7, ra6, rb6, rc6, rd6, re6, rf6, rg6, rh6, rh5, rg5, rf5, re5, rd5, rc5, rb5, ra5"
    );
    const tip = main.serialize();

    const branch = GameFactory("arimaa", opening);
    branch.move(
      "Ee2, Hb2, Dg2, Cd2, Ra2, Ra1, Rb1, Rc1, Rc2, Rd1, Re1, Rf1, Rf2, Rh1, Rg1, Rh2"
    );
    const branchGold = branch.serialize();
    branch.move(
      "ed7, me7, hg7, hb7, dd8, de8, cf7, cc7, ra7, ra8, rb8, rc8, rf8, rg8, rh8, rh7"
    );
    const selected = branch.serialize();
    const siblings = Array.from({ length: 6 }, () => ({
      state: opening,
      children: [],
    }));
    const nodes = [
      {
        state: opening,
        children: [
          ...siblings,
          {
            state: branchGold,
            children: [{ state: selected, children: [] }],
          },
        ],
      },
      { state: mainGold, children: [] },
      { state: tip, children: [] },
    ];
    const draft = buildStartPosition({
      game: { metaGame: "arimaa", state: tip, selectedVariants: ["free"] },
      nodes,
      focus: { moveNumber: 0, exPath: [6, 0] },
    });

    expect(draft.state).toBe(selected);
    expect(buildStartPositionPayload(draft.state)).toEqual({
      startPosition: { state: selected },
    });
    expect(draft.variants).toEqual(["free"]);
    const actual = GameFactory("arimaa", draft.state);
    expect(actual.board.get("d7")).toEqual(["E", 2]);
    expect(actual.board.size).toBe(32);
  });

  it("rejects a missing focus node instead of using the main-line tip", () => {
    expect(() =>
      buildStartPosition({
        game: { metaGame: "saltire" },
        nodes: [{ state: "tip", children: [] }],
        focus: { moveNumber: 0, exPath: [0] },
      })
    ).toThrow("Start position state is missing.");
  });
});
