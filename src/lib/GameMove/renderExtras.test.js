import { expect } from "chai";
import {
  buildGameMoveRenderExtras,
  isGameMoveArchiveSession,
} from "./renderExtras.js";

describe("isGameMoveArchiveSession", () => {
  it("is true when session gameOver is set", () => {
    expect(isGameMoveArchiveSession({ gameOver: true })).to.be.true;
  });

  it("is true when API gameEnded is set (completed dev-server games)", () => {
    expect(
      isGameMoveArchiveSession({ gameOver: false, gameEnded: 1791206378905 })
    ).to.be.true;
  });

  it("is false for in-progress games", () => {
    expect(isGameMoveArchiveSession({ gameOver: false, toMove: 0 })).to.be.false;
  });
});

describe("buildGameMoveRenderExtras", () => {
  it("uses seat perspective for in-progress games", () => {
    expect(buildGameMoveRenderExtras({ me: 0, gameOver: false })).to.deep.equal({
      perspective: 1,
    });
    expect(buildGameMoveRenderExtras({ me: 1, gameOver: false })).to.deep.equal({
      perspective: 2,
    });
  });

  it("uses seat 1 perspective for spectators", () => {
    expect(buildGameMoveRenderExtras({ me: -1, gameOver: false })).to.deep.equal({
      perspective: 1,
    });
  });

  it("lifts hidden-info fog when the session is over (gameOver)", () => {
    expect(buildGameMoveRenderExtras({ me: -1, gameOver: true })).to.deep.equal({
      perspective: 1,
      omniscient: true,
    });
    expect(buildGameMoveRenderExtras({ me: 0, gameOver: true })).to.deep.equal({
      perspective: 1,
      omniscient: true,
    });
  });

  it("lifts fog for completed records via gameEnded when gameOver is unset", () => {
    expect(
      buildGameMoveRenderExtras({
        me: 0,
        gameEnded: 1791206378905,
      })
    ).to.deep.equal({
      perspective: 1,
      omniscient: true,
    });
  });
});
