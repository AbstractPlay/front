import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { isTwoLegTournament } from "./tournamentFormat.js";

describe("isTwoLegTournament", () => {
  it("is true only for matchLegs 2", () => {
    assert.equal(isTwoLegTournament({ matchLegs: 2 }), true);
    assert.equal(isTwoLegTournament({ matchLegs: 1 }), false);
    assert.equal(isTwoLegTournament({}), false);
    assert.equal(isTwoLegTournament(null), false);
  });
});
