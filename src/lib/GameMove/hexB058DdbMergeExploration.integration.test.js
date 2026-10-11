/**
 * Move-table contract using prod DynamoDB private exploration shape (move 24 tip).
 * Tree is inline — same JSON as GAMEEXPLORATION#8a8e2d42-… sk 328adc5c-…#24 (2026-10-11).
 */
import { describe, expect, it } from "vitest";
import { GameFactory } from "@abstractplay/gameslib";
import { GameNode } from "../../components/GameMove/GameTree";
import { mergeExploration } from "./exploration";
import { applyPlayerSessionFields } from "./gameStuff";
import {
  filterPathCellsForSeat,
  resolveMoveTablePlayerSeats,
} from "./moveTablePathCells";
import { resolveMoveTableLayout } from "./moveTableLayout";
import { isIdleMainlineExplorationTip } from "./moveTreeVariations";
import hexB058 from "./fixtures/replays/hex-b058.json";

const REPORTER_ID = "328adc5c-9832-4c7e-869c-46f67a116939";

/** Parsed `tree` field from prod DDB (not wrapped in `{ children }`). */
const PROD_DDB_MOVE_24_TREE = [
  {
    move: "f9",
    children: [{ move: "e10", children: [], premove: true }],
  },
  {
    move: "i3",
    children: [{ move: "i2", children: [], premove: true }],
  },
];

function buildMainLineGameNodes(metaGame, stateStr) {
  const tmpEngine = GameFactory(metaGame, stateStr);
  const history = [];
  while (true) {
    history.unshift(
      new GameNode(
        null,
        tmpEngine.lastmove ?? "",
        null,
        tmpEngine.gameover ? "" : tmpEngine.currplayer - 1
      )
    );
    tmpEngine.stack.pop();
    tmpEngine.gameover = false;
    tmpEngine.winner = [];
    if (tmpEngine.stack.length === 0) break;
    tmpEngine.load();
  }
  for (let i = 0; i < history.length; i++) {
    const eng = GameFactory(metaGame, stateStr);
    eng.stack = eng.stack.slice(0, i + 1);
    eng.load();
    history[i].state = eng.cheapSerialize();
  }
  return history;
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

describe("hex b058 prod DDB exploration merge", () => {
  it("mergeExploration + filterPathCellsForSeat match reporter feedback layout", () => {
    const game = { ...hexB058.game };
    const me = {
      id: REPORTER_ID,
      settings: { all: { exploration: 1 } },
    };
    applyPlayerSessionFields(game, me, false);

    const exploration = buildMainLineGameNodes(game.metaGame, game.state);
    mergeExploration(
      game,
      exploration,
      [{ move: 24, tree: PROD_DDB_MOVE_24_TREE }],
      me,
      () => {},
      { current: "" }
    );

    expect(exploration.at(-1).children.map((c) => c.move).sort()).toEqual([
      "f9",
      "i3",
    ]);

    const focus = { moveNumber: exploration.length - 1, exPath: [] };
    const path = buildPathAtTip(exploration, focus, false);
    const layout = resolveMoveTableLayout({
      game: { numPlayers: game.numPlayers, simultaneous: false },
    });
    const seats = resolveMoveTablePlayerSeats(
      { players: game.players, toMove: game.toMove },
      me
    );

    const tipIdx = path.length - 1;
    const mainIdx = tipIdx - 1;
    expect(path[mainIdx][0].move).toBe("f6");
    expect(path[tipIdx].map((c) => c.move).sort()).toEqual(["f9", "i3"]);

    const branchRow = path[tipIdx];
    expect(
      filterPathCellsForSeat(branchRow, {
        seatIdx: 0,
        movenum: tipIdx,
        layout,
        ...seats,
      })
    ).toHaveLength(0);
    expect(
      filterPathCellsForSeat(branchRow, {
        seatIdx: 1,
        movenum: tipIdx,
        layout,
        ...seats,
      })
        .map((c) => c.move)
        .sort()
    ).toEqual(["f9", "i3"]);
  });
});
