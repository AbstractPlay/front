import { expect } from "chai";
import { vi } from "vitest";
import { GameNode } from "../../components/GameMove/GameTree";
import {
  applyPlayerSessionFields,
  syncGameSessionFromApi,
} from "./gameStuff";

vi.mock("../../stores", () => ({
  useStore: {
    getState: () => ({ users: {} }),
  },
}));

describe("game session sync", () => {
  const players = [
    { id: "user-a", name: "Tester 1" },
    { id: "user-b", name: "Tester 2" },
  ];

  it("applyPlayerSessionFields sets canSubmit when me arrives after anonymous setup", () => {
    const game = {
      simultaneous: false,
      toMove: 0,
      players,
      me: -1,
      canSubmit: false,
      canExplore: false,
      noExplore: false,
    };
    const me = { id: "user-a", settings: { all: { exploration: 0 } } };

    applyPlayerSessionFields(game, me, false);

    expect(game.me).to.equal(0);
    expect(game.canSubmit).to.be.true;
  });

  it("syncGameSessionFromApi restores focus.canExplore when globalMe loads late", () => {
    const game = {
      id: "g1",
      simultaneous: false,
      toMove: 0,
      players,
      gameOver: false,
      noExplore: false,
      numPlayers: 2,
      noMoves: false,
      metaGame: "pinch",
      state: "{}",
    };
    const priorGame = {
      ...game,
      me: -1,
      canSubmit: false,
      canExplore: false,
      colors: { 0: { value: "P1", isImage: false } },
    };
    const nodes = [new GameNode(null, "", "{}", 0)];
    const focus = { moveNumber: 0, exPath: [], canExplore: false };
    const gameRef = { current: priorGame };
    const explorationRef = { current: { gameID: "g1", nodes } };
    const focusRef = { current: focus };
    const movesRef = { current: null };
    const engineRef = {
      current: {
        moves: () => ["swap", "noswap"],
      },
    };
    const focusSetter = vi.fn();
    const me = { id: "user-a", settings: { all: { exploration: 0 } } };

    syncGameSessionFromApi({
      game,
      priorGame,
      me,
      explorer: false,
      explorationRef,
      focusRef,
      focusSetter,
      movesRef,
      engineRef,
      gameRef,
    });

    expect(gameRef.current.canSubmit).to.be.true;
    expect(focusSetter).to.have.been.calledOnce;
    expect(focusSetter.mock.calls[0][0].canExplore).to.be.true;
    expect(movesRef.current).to.deep.equal(["swap", "noswap"]);
  });

  it("syncGameSessionFromApi clears spine caches when game state changes", () => {
    const game = {
      id: "g1",
      simultaneous: false,
      toMove: 0,
      players,
      gameOver: false,
      noExplore: false,
      numPlayers: 2,
      noMoves: false,
      metaGame: "pinch",
      state: '{"v":2}',
      me: 0,
      canSubmit: true,
      canExplore: false,
    };
    const priorGame = {
      ...game,
      state: '{"v":1}',
      colors: { 0: { value: "P1", isImage: false } },
    };
    const nodes = [
      new GameNode(null, "", "cached-0", 0),
      new GameNode(null, "m1", "cached-1", 0),
    ];
    const focus = { moveNumber: 1, exPath: [], canExplore: false };
    const gameRef = { current: priorGame };
    const explorationRef = { current: { gameID: "g1", nodes } };
    const focusRef = { current: focus };
    const me = { id: "user-a", settings: { all: { exploration: 0 } } };

    syncGameSessionFromApi({
      game,
      priorGame,
      me,
      explorer: false,
      explorationRef,
      focusRef,
      focusSetter: vi.fn(),
      movesRef: { current: null },
      engineRef: { current: null },
      gameRef,
    });

    expect(nodes[0].state).to.be.null;
    expect(nodes[1].state).to.be.null;
  });
});
