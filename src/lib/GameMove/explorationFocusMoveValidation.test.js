import { expect } from "chai";
import { GameFactory } from "@abstractplay/gameslib";
import { GameNode } from "../../components/GameMove/GameTree";
import { createEngineAtFocus } from "./exploration";
import {
  applyExplorationMove,
  explorationMoveContext,
  isPartialExplorationMove,
} from "./explorationMoves";

describe("exploration focus-node move validation", () => {
  it("waldmeister full move validates on a fresh engine, not after partial move()", () => {
    let engine = GameFactory("waldmeister");
    engine.move("G3@h6");
    const atFocus = GameFactory("waldmeister", engine.cheapSerialize());

    const partial = "G3@h6-m1";
    const full = "G3@h6-m1,G3";

    expect(atFocus.validateMove(partial).valid).to.be.true;

    const fullOnFresh = GameFactory(
      "waldmeister",
      atFocus.cheapSerialize()
    ).validateMove(full);
    expect(fullOnFresh.valid).to.be.true;
    expect(fullOnFresh.complete).to.equal(1);

    atFocus.move(partial, { partial: true });
    expect(atFocus.validateMove(full).valid).to.be.false;
  });

  it("doView gate does not commit a Waldmeister slide on a fresh focus engine", () => {
    let engine = GameFactory("waldmeister");
    engine.move("G3@h6");
    const live = engine.cheapSerialize();
    const game = {
      metaGame: "waldmeister",
      state: live,
      me: 0,
      numPlayers: 2,
      simultaneous: false,
    };
    const exploration = [];
    let tmp = GameFactory("waldmeister", live);
    while (true) {
      exploration.unshift(
        new GameNode(null, tmp.lastmove, null, tmp.gameover ? "" : tmp.currplayer - 1)
      );
      tmp.stack.pop();
      tmp.gameover = false;
      tmp.winner = [];
      if (tmp.stack.length === 0) break;
      tmp.load();
    }
    const focus = { moveNumber: exploration.length - 1, exPath: [] };
    const atFocus = createEngineAtFocus(game, exploration, focus);
    const click = atFocus.handleClick("G3@h6", 12, 0, null);
    const again = createEngineAtFocus(game, exploration, focus);
    const partial = isPartialExplorationMove(again, click.move, {
      userCompleted: click.complete === 1,
      ...explorationMoveContext(game),
    });
    expect(click.move).to.equal("G3@h6-m1");
    expect(click.complete).to.equal(-1);
    expect(partial).to.be.true;
  });

  it("reloads a committed Waldmeister ply so the next click sees the new piece", () => {
    const engine = GameFactory("waldmeister");
    engine.move("G3@h6");
    applyExplorationMove(engine, "G3@h6-h8,Y1", { metaGame: "waldmeister" });
    const continued = GameFactory("waldmeister", engine.cheapSerialize());
    expect(continued.board.get("h8")).to.deep.equal(["G", 3]);
    expect(continued.board.get("h6")).to.deep.equal(["Y", 1]);
    const click = continued.handleClick("", 7, 5, null);
    expect(click.move).to.equal("Y1@h6");
    expect(click.valid).to.be.true;
  });
});
