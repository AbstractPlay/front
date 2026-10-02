import { expect } from "chai";
import {
  LAB_SIM_ELIM_CHAR,
  applySimultaneousGameFields,
  initialSeatToMove,
  isSeatSubmitBlocked,
  joinPartialRow,
  soleActiveSeat,
  splitPartialRow,
  submitSeatRound,
} from "./simultaneousRound.js";

function mockEngine({ numplayers = 3, eliminated = () => false, moveCalls } = {}) {
  const calls = moveCalls ?? [];
  return {
    numplayers,
    isEliminated: eliminated,
    move(m, opts) {
      calls.push({ m, opts });
    },
    serialize() {
      return "{}";
    },
  };
}

describe("simultaneousRound", () => {
  it("splitPartialRow pads to numPlayers", () => {
    expect(splitPartialRow("a,b", 4)).to.deep.equal(["a", "b", "", ""]);
  });

  it("initialSeatToMove marks eliminated seats false", () => {
    const engine = mockEngine({
      eliminated: (s) => s === 2,
    });
    expect(initialSeatToMove(engine, 3)).to.deep.equal([true, false, true]);
  });

  it("submitSeatRound injects elim token and commits when all slots filled", () => {
    const moveCalls = [];
    const engine = mockEngine({
      numplayers: 3,
      eliminated: (s) => s === 2,
      moveCalls,
    });
    let partialMove = ",,";
    let toMove = [true, false, true];

    const r1 = submitSeatRound({
      engine,
      numPlayers: 3,
      seatIndex: 0,
      fragment: "m1",
      partialMove,
      toMove,
    });
    expect(r1.committed).to.equal(false);
    expect(splitPartialRow(r1.partialMove, 3)).to.deep.equal([
      "m1",
      LAB_SIM_ELIM_CHAR,
      "",
    ]);

    partialMove = r1.partialMove;
    toMove = r1.toMove;
    const r2 = submitSeatRound({
      engine,
      numPlayers: 3,
      seatIndex: 2,
      fragment: "m3",
      partialMove,
      toMove,
    });
    expect(r2.committed).to.equal(true);
    const lastCall = moveCalls[moveCalls.length - 1];
    expect(lastCall?.opts?.partial).to.not.equal(true);
    expect(isSeatSubmitBlocked(engine, 1, r2.toMove)).to.equal(true);
  });

  it("isSeatSubmitBlocked when already submitted", () => {
    const engine = mockEngine();
    expect(isSeatSubmitBlocked(engine, 0, [false, true])).to.equal(true);
  });

  it("joinPartialRow round-trips", () => {
    expect(joinPartialRow(["a", "", "c"])).to.equal("a,,c");
  });

  it("soleActiveSeat returns seat only when one player remains", () => {
    const engine = mockEngine({
      eliminated: (s) => s === 1 || s === 2,
    });
    expect(soleActiveSeat(engine)).to.equal(3);
    const engine2 = mockEngine({
      eliminated: (s) => s === 2,
    });
    expect(soleActiveSeat(engine2)).to.equal(null);
  });

  it("applySimultaneousGameFields selects lone survivor seat", () => {
    const engine = mockEngine({
      eliminated: (s) => s !== 3,
    });
    const game = { me: 0, labActiveSeat: 1 };
    applySimultaneousGameFields(game, engine);
    expect(game.me).to.equal(2);
    expect(game.labActiveSeat).to.equal(3);
  });
});
