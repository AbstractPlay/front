import { vi } from "vitest";
import { GameNode } from "../../components/GameMove/GameTree";
import { callAuthApi } from "../api";
import {
  mergeExploration,
  parseSaveExplorationConflictPayload,
  saveExploration,
} from "./exploration";

vi.mock("../api", () => ({
  callAuthApi: vi.fn(),
}));

vi.mock("./misc", () => ({
  isInterestingComment: () => false,
}));

vi.mock("@abstractplay/gameslib", () => ({
  GameFactory: (_metaGame, state) => {
    const legal = [">e,12-d1", ">w,12-d1"];

    function createEngine() {
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
        clone() {
          return createEngine();
        },
        serialize: () => state,
        cheapSerialize: () => state,
        load: vi.fn(),
        gameover: false,
        winner: [],
      };
    }

    return createEngine();
  },
}));

describe("parseSaveExplorationConflictPayload", () => {
  it("returns null for success and error-shaped payloads without a tree", () => {
    expect(parseSaveExplorationConflictPayload({ success: true })).toBe(null);
    expect(
      parseSaveExplorationConflictPayload({
        message: "Handler returned no response",
      })
    ).toBe(null);
  });

  it("parses public exploration conflict records", () => {
    const payload = parseSaveExplorationConflictPayload({
      version: 2,
      sk: "3",
      tree: JSON.stringify({ children: [{ move: "a1", children: [] }] }),
    });
    expect(payload?.move).toBe(3);
    expect(payload?.tree.children).toHaveLength(1);
  });

  it("parses private exploration sk user#move", () => {
    const payload = parseSaveExplorationConflictPayload({
      sk: "user-1#4",
      tree: { children: [] },
    });
    expect(payload?.move).toBe(4);
  });
});

describe("saveExploration", () => {
  const game = {
    id: "g1",
    metaGame: "carnac",
    state: JSON.stringify({ stack: [{}, {}] }),
    gameOver: false,
    numMoves: 2,
    numPlayers: 2,
    players: [],
  };

  const exploration = [
    new GameNode(null, "", JSON.stringify({ stack: [{}] }), 0),
    new GameNode(null, "12-a1", JSON.stringify({ stack: [{}, {}] }), 1),
  ];

  it("does not throw when the API returns an envelope error body", async () => {
    callAuthApi.mockResolvedValueOnce({
      status: 200,
      text: async () =>
        JSON.stringify({
          statusCode: 500,
          body: JSON.stringify({ message: "Handler returned no response" }),
        }),
    });
    const errorSetter = vi.fn();
    const errorMessageRef = { current: "" };
    await expect(
      saveExploration(
        exploration,
        2,
        game,
        { id: "u1", settings: { all: { exploration: 1 } } },
        true,
        errorSetter,
        errorMessageRef
      )
    ).resolves.toBeUndefined();
    expect(errorSetter).toHaveBeenCalledWith(true);
    expect(errorMessageRef.current).toContain("Handler returned no response");
  });
});

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
