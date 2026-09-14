import { describe, expect, it } from "vitest";
import {
  buildMostPlayedOpponentPicks,
  buildOpponentQuickPickSections,
  buildRecentOpponentPicks,
} from "./playerOpponentQuickPicks";

const ME = "user-me";
const OPP_A = "opp-a";
const OPP_B = "opp-b";

function gameRec(dateEnd, opponents) {
  return {
    header: {
      "date-end": dateEnd,
      players: [
        { userid: ME, result: 1 },
        ...opponents.map((id) => ({ userid: id, result: 0 })),
      ],
    },
  };
}

describe("buildMostPlayedOpponentPicks", () => {
  it("orders by game count against each opponent", () => {
    const recs = [
      gameRec("2024-01-01", [OPP_A]),
      gameRec("2024-01-02", [OPP_A]),
      gameRec("2024-01-03", [OPP_B]),
    ];
    const picks = buildMostPlayedOpponentPicks(recs, ME, 2);
    expect(picks[0].id).toBe(OPP_A);
    expect(picks[0].count).toBe(2);
    expect(picks[1].id).toBe(OPP_B);
  });
});

describe("buildRecentOpponentPicks", () => {
  it("returns distinct opponents by most recent game", () => {
    const recs = [
      gameRec("2024-01-01", [OPP_A]),
      gameRec("2024-01-05", [OPP_B]),
      gameRec("2024-01-03", [OPP_A]),
    ];
    const picks = buildRecentOpponentPicks(recs, ME, 2);
    expect(picks.map((p) => p.id)).toEqual([OPP_B, OPP_A]);
  });
});

describe("buildOpponentQuickPickSections", () => {
  it("dedupes opponents across sections", () => {
    const recs = [
      gameRec("2024-01-05", [OPP_A]),
      gameRec("2024-01-01", [OPP_A]),
      gameRec("2024-01-02", [OPP_A]),
    ];
    const sections = buildOpponentQuickPickSections({
      allRecs: recs,
      myUserId: ME,
    });
    const allIds = sections.flatMap((s) => s.opponents.map((o) => o.id));
    expect(allIds.filter((id) => id === OPP_A).length).toBe(1);
  });
});
