import { expect } from "chai";
import { GameFactory } from "@abstractplay/gameslib";
import { ENTROPY_ORDER_STATE } from "./GameMove/fixtures/entropy.js";
import { buildEngineMoveResults } from "./engineMoveResults.js";

describe("buildEngineMoveResults", () => {
  it("includes formatted text for partial simultaneous round when gameslib emits lines", () => {
    const engine = GameFactory("entropy", ENTROPY_ORDER_STATE);
    engine.move("d5-d4,", { partial: true, trusted: true });

    const results = buildEngineMoveResults(engine, ["Perlkönig", "Tester"]);

    expect(results.every((r) => r.log.length > 0)).to.be.true;
    const newest = results[0];
    expect(newest.log).to.match(/d5|d4/i);
  });
});
