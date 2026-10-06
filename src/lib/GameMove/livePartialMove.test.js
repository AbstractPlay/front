import { expect } from "chai";
import { GameFactory } from "@abstractplay/gameslib";
import { ENTROPY_ORDER_STATE } from "./fixtures/entropy.js";
import {
  applyLivePartialPreview,
  livePartialMoveHasContent,
  partialMoveSeatFragment,
  shouldApplyLivePartialPreview,
  splitLivePartialRow,
} from "./livePartialMove.js";
import { buildLivePlayViewEngine } from "./gameStuff.js";
import { GameNode } from "../../components/GameMove/GameTree.js";

describe("livePartialMove", () => {
  it("splitLivePartialRow pads to numPlayers", () => {
    expect(splitLivePartialRow("d5-d4,", 2)).to.deep.equal(["d5-d4", ""]);
  });

  it("livePartialMoveHasContent rejects empty wire", () => {
    expect(livePartialMoveHasContent(",", 2)).to.be.false;
    expect(livePartialMoveHasContent("d5-d4,", 2)).to.be.true;
  });

  it("partialMoveSeatFragment returns seat fragment", () => {
    expect(partialMoveSeatFragment("d5-d4,", 0, 2)).to.equal("d5-d4");
    expect(partialMoveSeatFragment("d5-d4,", 1, 2)).to.equal("");
  });

  it("shouldApplyLivePartialPreview requires live tip without exPath", () => {
    const exploration = [{}, {}];
    const game = {
      simultaneous: true,
      numPlayers: 2,
      partialMove: "d5-d4,",
      toMove: [false, true],
    };
    const atTip = { moveNumber: 1, exPath: [] };
    const offTip = { moveNumber: 0, exPath: [] };
    const exploring = { moveNumber: 1, exPath: [0] };

    expect(shouldApplyLivePartialPreview(game, exploration, atTip)).to.be.true;
    expect(shouldApplyLivePartialPreview(game, exploration, offTip)).to.be
      .false;
    expect(shouldApplyLivePartialPreview(game, exploration, exploring)).to.be
      .false;
  });

  it("applyLivePartialPreview updates Entropy order board", () => {
    const engine = GameFactory("entropy", ENTROPY_ORDER_STATE);
    const before = engine.render({ perspective: 1 });
    const applied = applyLivePartialPreview(engine, "d5-d4,", 2);
    expect(applied).to.be.true;
    const after = engine.render({ perspective: 1 });
    expect(JSON.stringify(before)).to.not.equal(JSON.stringify(after));
  });
});

describe("buildLivePlayViewEngine (Entropy waiting on opponent)", () => {
  it("applies partialMove at live tip", () => {
    const engine0 = GameFactory("entropy", ENTROPY_ORDER_STATE);
    const state = engine0.cheapSerialize();
    const exploration = [
      new GameNode(null, "", state, 0),
      new GameNode(state, engine0.lastmove, null, 0),
    ];
    exploration[1].state = state;

    const game = {
      metaGame: "entropy",
      state,
      simultaneous: true,
      numPlayers: 2,
      partialMove: "d5-d4,",
      toMove: [false, true],
      me: 0,
      players: [{ id: "a" }, { id: "b" }],
    };
    const focus = { moveNumber: 1, exPath: [] };

    const { engine, appliedPartial } = buildLivePlayViewEngine(
      game,
      exploration,
      focus
    );
    expect(appliedPartial).to.be.true;
    const withPartial = engine.render({ perspective: 1 });
    const { engine: bare } = buildLivePlayViewEngine(
      { ...game, partialMove: "," },
      exploration,
      focus
    );
    expect(JSON.stringify(withPartial)).to.not.equal(
      JSON.stringify(bare.render({ perspective: 1 }))
    );
  });
});
