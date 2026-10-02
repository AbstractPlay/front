import { expect } from "chai";
import {
  createLabViewEngine,
  engineSupportsPlayerStrip,
  LAB_HIDDEN_VIEW_GOD,
  LAB_HIDDEN_VIEW_LIVE,
  labDisplayMoveLabel,
  labRenderExtras,
  liveStripPlayer,
  normalizeLabHiddenViewMode,
  shouldStripForLiveView,
} from "./hiddenView.js";

function mockEngine({
  numplayers = 2,
  gameover = false,
  currplayer = 1,
  full = "full",
  stripByPlayer = { 1: "p1", 2: "p2" },
} = {}) {
  return {
    numplayers,
    gameover,
    currplayer,
    serialize(opts) {
      if (opts?.strip === true && opts.player !== undefined) {
        const key = opts.player;
        if (stripByPlayer[key] !== undefined) {
          return stripByPlayer[key];
        }
      }
      return full;
    },
  };
}

describe("hiddenView", () => {
  it("normalizeLabHiddenViewMode defaults unknown to god", () => {
    expect(normalizeLabHiddenViewMode("live")).to.equal(LAB_HIDDEN_VIEW_LIVE);
    expect(normalizeLabHiddenViewMode("god")).to.equal(LAB_HIDDEN_VIEW_GOD);
    expect(normalizeLabHiddenViewMode(undefined)).to.equal(LAB_HIDDEN_VIEW_GOD);
  });

  it("engineSupportsPlayerStrip detects differing strip serializations", () => {
    expect(engineSupportsPlayerStrip(mockEngine())).to.be.true;
    expect(
      engineSupportsPlayerStrip(
        mockEngine({ full: "same", stripByPlayer: { 1: "same", 2: "same" } })
      )
    ).to.be.false;
  });

  it("liveStripPlayer uses currplayer", () => {
    expect(liveStripPlayer(mockEngine({ currplayer: 2 }))).to.equal(2);
  });

  it("liveStripPlayer prefers explicit active seat", () => {
    expect(liveStripPlayer(mockEngine({ currplayer: 1 }), 3)).to.equal(3);
  });

  it("shouldStripForLiveView is false when game over or god mode", () => {
    const engine = mockEngine();
    expect(shouldStripForLiveView(engine, LAB_HIDDEN_VIEW_GOD)).to.be.false;
    expect(shouldStripForLiveView(engine, LAB_HIDDEN_VIEW_LIVE)).to.be.true;
    expect(
      shouldStripForLiveView(
        mockEngine({ gameover: true }),
        LAB_HIDDEN_VIEW_LIVE
      )
    ).to.be.false;
  });

  it("createLabViewEngine returns same instance when strip not needed", () => {
    const engine = mockEngine({ full: "x", stripByPlayer: { 1: "x", 2: "x" } });
    expect(createLabViewEngine("test", engine, LAB_HIDDEN_VIEW_LIVE)).to.equal(
      engine
    );
  });

  it("labRenderExtras sets omniscient and perspective in god mode", () => {
    const engine = { currplayer: 2 };
    expect(labRenderExtras(engine, LAB_HIDDEN_VIEW_GOD)).to.deep.equal({
      perspective: 2,
      omniscient: true,
    });
    expect(labRenderExtras(engine, LAB_HIDDEN_VIEW_GOD, 3)).to.deep.equal({
      perspective: 3,
      omniscient: true,
    });
    expect(labRenderExtras(engine, LAB_HIDDEN_VIEW_LIVE)).to.deep.equal({
      perspective: 2,
    });
  });

  it("labDisplayMoveLabel leaves text unchanged in god mode", () => {
    expect(
      labDisplayMoveLabel("agofmars", "{}", 1, "RD2,BU1", LAB_HIDDEN_VIEW_GOD)
    ).to.equal("RD2,BU1");
  });
});
