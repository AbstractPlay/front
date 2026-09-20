import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  isTwoLegTournament,
  tournamentSeriesKey,
} from "./tournamentFormat.js";

describe("isTwoLegTournament", () => {
  it("is true only for matchLegs 2", () => {
    assert.equal(isTwoLegTournament({ matchLegs: 2 }), true);
    assert.equal(isTwoLegTournament({ matchLegs: 1 }), false);
    assert.equal(isTwoLegTournament({}), false);
    assert.equal(isTwoLegTournament(null), false);
  });
});

describe("tournamentSeriesKey", () => {
  it("separates single- and two-leg series", () => {
    const single = tournamentSeriesKey("mvolcano", ["size7"]);
    const twoLeg = tournamentSeriesKey("mvolcano", ["size7"], 2);
    assert.equal(twoLeg, `${single}#2`);
    assert.notEqual(single, twoLeg);
  });
});
