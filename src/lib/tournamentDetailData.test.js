import { describe, it } from "vitest";
import assert from "node:assert/strict";
import {
  buildTournamentDivisions,
  parseTournamentDetailResponse,
} from "./tournamentDetailData.js";

describe("parseTournamentDetailResponse", () => {
  it("returns notFound when tournament array is empty", () => {
    assert.deepEqual(parseTournamentDetailResponse({ tournament: [] }), {
      ok: false,
      reason: "notFound",
    });
  });

  it("parses a minimal started tournament", () => {
    const result = parseTournamentDetailResponse({
      tournament: [
        {
          id: "t1",
          metaGame: "go",
          divisions: {
            1: { numGames: 0, numCompleted: 0, processed: false, players: [] },
          },
        },
      ],
      tournamentPlayers: [],
      tournamentGames: [],
      comments: [],
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.tournament.id, "t1");
      assert.equal(result.divisions.length, 1);
    }
  });

  it("allows registration-phase tournament without divisions", () => {
    const result = parseTournamentDetailResponse({
      tournament: [{ id: "t2", metaGame: "go", started: false }],
      tournamentPlayers: [{ playerid: "p1", playername: "A" }],
      tournamentGames: [],
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.divisions, []);
      assert.equal(result.playerRows.length, 1);
    }
  });
});

describe("buildTournamentDivisions", () => {
  it("returns null without a tournament record", () => {
    assert.equal(buildTournamentDivisions(undefined, [], []), null);
  });

  it("returns [] when divisions are not set yet", () => {
    assert.deepEqual(buildTournamentDivisions({ id: "t" }, [], []), []);
  });
});
