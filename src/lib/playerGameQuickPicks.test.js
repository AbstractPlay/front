import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import {
  buildMostPlayedQuickPicks,
  buildPlayerQuickPickSections,
  buildRecentlyPlayedQuickPicks,
  metaGameFromDisplayName,
  metaGameFromPlayerRecord,
} from "./playerGameQuickPicks";

function firstGames(count) {
  return [...gameinfo.values()].slice(0, count);
}

const sampleRec = (meta, gameName, dateEnd) => ({
  header: {
    game: { name: gameName },
    site: { gameid: `${meta}#abc123` },
    "date-end": dateEnd,
  },
});

describe("metaGameFromDisplayName", () => {
  it("resolves by name prefix", () => {
    const info = gameinfo.values().next().value;
    expect(metaGameFromDisplayName(info.name)).toBe(info.uid);
  });

  it("returns null for empty input", () => {
    expect(metaGameFromDisplayName("")).toBeNull();
    expect(metaGameFromDisplayName(null)).toBeNull();
  });
});

describe("metaGameFromPlayerRecord", () => {
  it("reads meta from site gameid hash", () => {
    const info = gameinfo.values().next().value;
    expect(
      metaGameFromPlayerRecord(sampleRec(info.uid, info.name, "2024-01-01"))
    ).toBe(info.uid);
  });
});

describe("buildMostPlayedQuickPicks", () => {
  it("orders by play count", () => {
    const [gameA, gameB] = firstGames(2);
    const recs = [
      sampleRec(gameA.uid, gameA.name, "2024-01-01"),
      sampleRec(gameA.uid, gameA.name, "2024-01-02"),
      sampleRec(gameB.uid, gameB.name, "2024-01-03"),
    ];
    const picks = buildMostPlayedQuickPicks(recs, 2);
    expect(picks[0].id).toBe(gameA.uid);
    expect(picks.length).toBe(2);
  });
});

describe("buildRecentlyPlayedQuickPicks", () => {
  it("returns distinct games by most recent date", () => {
    const [gameA, gameB] = firstGames(2);
    const recs = [
      sampleRec(gameA.uid, gameA.name, "2024-01-01"),
      sampleRec(gameB.uid, gameB.name, "2024-01-05"),
      sampleRec(gameA.uid, gameA.name, "2024-01-03"),
    ];
    const picks = buildRecentlyPlayedQuickPicks(recs, 2);
    expect(picks[0].id).toBe(gameB.uid);
    expect(picks[1].id).toBe(gameA.uid);
  });
});

describe("buildPlayerQuickPickSections", () => {
  it("dedupes games across sections", () => {
    const [gameA] = firstGames(1);
    const recs = [
      sampleRec(gameA.uid, gameA.name, "2024-01-01"),
      sampleRec(gameA.uid, gameA.name, "2024-01-02"),
    ];
    const sections = buildPlayerQuickPickSections({
      starredIds: [gameA.uid],
      allRecs: recs,
      summary: null,
      userId: "user1",
    });
    const allIds = sections.flatMap((s) => s.games.map((g) => g.id));
    expect(allIds.filter((id) => id === gameA.uid).length).toBe(1);
  });
});
