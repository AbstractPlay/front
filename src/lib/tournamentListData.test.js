import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  dashboardTournamentsToCurrentRows,
  tournamentDivisionsCompletion,
} from "./tournamentListData.js";

describe("tournamentDivisionsCompletion", () => {
  it("sums numCompleted and numGames across divisions", () => {
    assert.deepEqual(
      tournamentDivisionsCompletion({
        1: { numCompleted: 3, numGames: 10 },
        2: { numCompleted: 1, numGames: 6 },
      }),
      { numCompleted: 4, numGames: 16 }
    );
  });

  it("returns zeros for missing divisions", () => {
    assert.deepEqual(tournamentDivisionsCompletion(undefined), {
      numCompleted: 0,
      numGames: 0,
    });
  });
});

describe("dashboardTournamentsToCurrentRows", () => {
  it("maps API shape to dashboard table rows", () => {
    const rows = dashboardTournamentsToCurrentRows([
      {
        id: "tid-1",
        metaGame: "mhex",
        variants: ["size11"],
        number: 4,
        matchLegs: 2,
        dateStarted: 1_700_000_000_000,
        divisions: { 1: { numCompleted: 2, numGames: 4 } },
        players: ["u1", "u2"],
      },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tournamentid, "tid-1");
    assert.equal(rows[0].realMeta, "mhex");
    assert.equal(rows[0].number, 4);
    assert.equal(rows[0].matchLegs, 2);
    assert.deepEqual(rows[0].players, ["u1", "u2"]);
    assert.deepEqual(rows[0].completion, {
      numCompleted: 2,
      numGames: 4,
    });
    assert.equal(typeof rows[0].variants, "string");
    assert.equal(typeof rows[0].metaGame, "string");
  });

  it("returns empty array for non-array input", () => {
    assert.deepEqual(dashboardTournamentsToCurrentRows(null), []);
  });
});
