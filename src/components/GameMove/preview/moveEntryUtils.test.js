import { expect } from "chai";
import {
  getLivePlayerClockChips,
  getPlayerClockChips,
} from "./moveEntryUtils";

describe("moveEntryUtils clocks", () => {
  it("getLivePlayerClockChips uses live game.toMove, not a historical side", () => {
    const now = 1_000_000;
    const game = {
      toMove: 0,
      lastMoveTime: now - 10_000,
      players: [
        { id: "a", time: 60_000 },
        { id: "b", time: 60_000 },
      ],
    };

    const live = getLivePlayerClockChips(game, [], now);
    const historicalOpponentTurn = getPlayerClockChips(game, 1, [], now);

    expect(live[0].active).to.be.true;
    expect(live[1].active).to.be.false;
    expect(historicalOpponentTurn[1].active).to.be.true;
    expect(live[0].time).to.not.equal(live[1].time);
    expect(live[0].playerId).to.equal("a");
    expect(live[1].playerId).to.equal("b");
  });

  it("getLivePlayerClockChips treats string game.toMove like numeric index", () => {
    const now = 1_000_000;
    const game = {
      toMove: "1",
      lastMoveTime: now - 10_000,
      players: [
        { id: "a", time: 60_000 },
        { id: "b", time: 5_000 },
      ],
    };

    const live = getLivePlayerClockChips(game, [], now);

    expect(live[0].active).to.be.false;
    expect(live[1].active).to.be.true;
    expect(live[1].time).to.match(/^-/);
  });
});
