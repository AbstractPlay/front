import { describe, expect, it } from "vitest";
import { resolvePlayUiToMove, isMyTurnForPlayUi } from "./playUiToMove";

describe("resolvePlayUiToMove", () => {
  const game = {
    simultaneous: false,
    gameOver: false,
    toMove: "1",
    metaGame: "hex",
    state: "{}",
    players: [{ id: "a" }, { id: "b" }],
  };

  it("uses live game.toMove on the main-line tip", () => {
    const exploration = [
      { move: "", state: "{}", toMove: 0, children: [] },
      { move: "f6", state: "{}", toMove: 0, children: [{ move: "f9" }] },
    ];
    const focus = { moveNumber: 1, exPath: [] };
    expect(resolvePlayUiToMove(game, exploration, focus)).toBe("1");
  });

  it("uses focus node toMove when exploring a branch at the tip", () => {
    const exploration = [
      { move: "", state: "{}", toMove: 0, children: [] },
      {
        move: "f6",
        state: "{}",
        toMove: 1,
        children: [{ move: "f9", state: "{}", toMove: 0, children: [] }],
      },
    ];
    const focus = { moveNumber: 1, exPath: [0] };
    expect(resolvePlayUiToMove(game, exploration, focus)).toBe(0);
  });

  it("uses focus node toMove in history", () => {
    const exploration = [
      { move: "", state: "{}", toMove: 0, children: [] },
      { move: "a", state: "{}", toMove: 1, children: [] },
      { move: "b", state: "{}", toMove: 0, children: [] },
    ];
    const focus = { moveNumber: 1, exPath: [] };
    expect(resolvePlayUiToMove({ ...game, toMove: "0" }, exploration, focus)).toBe(
      1
    );
  });
});

describe("isMyTurnForPlayUi", () => {
  it("matches seat index when game.toMove is a string", () => {
    expect(
      isMyTurnForPlayUi(
        { canSubmit: true, me: 0, toMove: "1" },
        "1"
      )
    ).toBe(false);
    expect(
      isMyTurnForPlayUi(
        { canSubmit: true, me: 1, toMove: "1" },
        "1"
      )
    ).toBe(true);
  });
});
