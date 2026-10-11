import { describe, expect, it } from "vitest";
import {
  filterPathCellsForSeat,
  resolveMoveTablePlayerSeats,
} from "./moveTablePathCells";
import { resolveMoveTableLayout } from "./moveTableLayout";
import { isIdleMainlineExplorationTip } from "./moveTreeVariations";

const GAME_ID = "8a8e2d42-a0ae-4366-834d-fc476f52adca";
const REPORTER_ID = "328adc5c-9832-4c7e-869c-46f67a116939";
const API = "https://7n1lziet28.execute-api.us-east-1.amazonaws.com/prod/query";

function buildExplorationSpineFromStack(state) {
  return state.stack.map((frame, i) => ({
    move: i === 0 ? "" : frame.lastmove ?? "",
    children: [],
    outcome: -1,
  }));
}

function buildPathAtTip(exploration, focus, gameOver) {
  const path = [];
  if (isIdleMainlineExplorationTip(focus, exploration, gameOver)) {
    return path;
  }
  for (
    let i = 1;
    i <=
    (exploration[focus.moveNumber].children.length > 0
      ? focus.moveNumber
      : exploration.length - 1);
    i++
  ) {
    path.push([
      {
        move: exploration[i].move,
        path: { moveNumber: i, exPath: [] },
      },
    ]);
  }
  let node = exploration[focus.moveNumber];
  let exPath = [...(focus.exPath ?? [])];
  while (node && node.children.length > 0) {
    const next = [];
    for (let k = 0; k < node.children.length; k++) {
      const c = node.children[k];
      next.push({
        move: c.move,
        premove: c.premove,
        path: { moveNumber: focus.moveNumber, exPath: exPath.concat(k) },
      });
    }
    exPath = exPath.concat(0);
    path.push(next);
    if (next.length !== 1) break;
    node = node.children[0];
  }
  return path;
}

describe("prod hex b058a884 exploration move table", () => {
  it("loads prod game and splits tip branches into correct player columns", async () => {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "get_game",
        pars: { metaGame: "hex", id: GAME_ID, cbit: 0 },
      }),
    });
    const { game } = await res.json();
    const state = JSON.parse(game.state);

    // Prod DDB snapshot (move 24) for game 8a8e2d42-… on 2026-10-11
    const tipChildren = [
      { move: "f9", children: [{ move: "e10", children: [], premove: true }] },
      { move: "i3", children: [{ move: "i2", children: [], premove: true }] },
    ];

    const exploration = buildExplorationSpineFromStack(state);
    exploration[exploration.length - 1].children = tipChildren;

    const focus = { moveNumber: exploration.length - 1, exPath: [] };
    const path = buildPathAtTip(exploration, focus, false);
    const layout = resolveMoveTableLayout({
      game: { numPlayers: game.numPlayers, simultaneous: false },
    });
    const seats = resolveMoveTablePlayerSeats(
      { players: game.players, toMove: game.toMove },
      { id: REPORTER_ID }
    );

    const tipIdx = path.length - 1;
    const branchRow = path[tipIdx];
    expect(branchRow.length).toBeGreaterThan(1);
    expect(branchRow.map((c) => c.move).sort()).toEqual(["f9", "i3"]);

    const mainlineIdx = tipIdx - 1;
    expect(path[mainlineIdx][0].move).toBe("f6");
    const mainSeat = filterPathCellsForSeat(path[mainlineIdx], {
      seatIdx: 0,
      movenum: mainlineIdx,
      layout,
      playerSeat: seats.playerSeat,
      toMoveSeat: seats.toMoveSeat,
    });
    expect(mainSeat.map((c) => c.move)).toEqual(["f6"]);

    const seat0 = filterPathCellsForSeat(branchRow, {
      seatIdx: 0,
      movenum: tipIdx,
      layout,
      playerSeat: seats.playerSeat,
      toMoveSeat: seats.toMoveSeat,
    });
    const seat1 = filterPathCellsForSeat(branchRow, {
      seatIdx: 1,
      movenum: tipIdx,
      layout,
      playerSeat: seats.playerSeat,
      toMoveSeat: seats.toMoveSeat,
    });

    expect(seat0).toHaveLength(0);
    expect(seat1.map((c) => c.move).sort()).toEqual(["f9", "i3"]);
    expect(game.toMove).toBe("1");
  });
});
