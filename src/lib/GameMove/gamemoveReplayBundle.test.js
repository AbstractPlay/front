import { describe, expect, it } from "vitest";
import { GameFactory } from "@abstractplay/gameslib";
import { GameNode } from "../../components/GameMove/GameTree";
import { applyPlayerSessionFields } from "./gameStuff";
import { mergeExploration } from "./exploration";
import {
  filterPathCellsForSeat,
  resolveMoveTablePlayerSeats,
} from "./moveTablePathCells";
import { resolveMoveTableLayout } from "./moveTableLayout";
import { isIdleMainlineExplorationTip } from "./moveTreeVariations";
import { assertGameMoveReplayBundle } from "./replay/bundleFormat";
import hexB058 from "./fixtures/replays/hex-b058.json";

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

describe("gamemove replay bundle hex-b058", () => {
  it("parses committed fixture", () => {
    const bundle = assertGameMoveReplayBundle(hexB058);
    expect(bundle.route.gameID).toBeTruthy();
    expect(bundle.viewAs.playerId).toBeTruthy();
  });

  it("view-as seat matches prod move-table contract", () => {
    const bundle = assertGameMoveReplayBundle(hexB058);
    const game = { ...bundle.game };
    const me = {
      id: bundle.viewAs.playerId,
      settings: bundle.viewAs.settings ?? { all: { exploration: 1 } },
    };
    applyPlayerSessionFields(game, me, false);

    const exploration = buildMainLineGameNodes(game.metaGame, game.state);
    const row = bundle.explorationRows[0];
    expect(row?.move).toBe(exploration.length);
    mergeExploration(
      game,
      exploration,
      [row],
      me,
      () => {},
      { current: "" }
    );

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
    const branchRow = path[tipIdx];
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

  it("exploration row move matches stack length", () => {
    const bundle = assertGameMoveReplayBundle(hexB058);
    const engine = GameFactory(bundle.game.metaGame, bundle.game.state);
    expect(bundle.explorationRows[0]?.move).toBe(engine.stack.length);
  });
});
