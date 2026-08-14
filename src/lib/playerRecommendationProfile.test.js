import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import {
  buildPlayerRecommendationProfile,
  PROFILE_WEIGHTS,
} from "./playerRecommendationProfile";
import { metaGameFromPlayerRecord } from "./playerGameQuickPicks";

const sampleRec = (meta, gameName, dateEnd) => ({
  header: {
    game: { name: gameName },
    site: { gameid: `${meta}#abc123` },
    "date-end": dateEnd,
  },
});

describe("buildPlayerRecommendationProfile", () => {
  it("computes playShare relative to total plays", () => {
    const [gameA, gameB] = [...gameinfo.values()].slice(0, 2);
    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      starredIds: [],
      allRecs: [
        sampleRec(gameA.uid, gameA.name, "2024-01-01"),
        sampleRec(gameA.uid, gameA.name, "2024-01-02"),
        sampleRec(gameA.uid, gameA.name, "2024-01-03"),
        sampleRec(gameA.uid, gameA.name, "2024-01-04"),
        sampleRec(gameB.uid, gameB.name, "2024-01-05"),
      ],
      summary: null,
    });

    expect(profile.playShare.get(gameA.uid)).toBeCloseTo(0.8);
    expect(profile.playShare.get(gameB.uid)).toBeCloseTo(0.2);
    expect(profile.playCounts.get(gameA.uid)).toBe(4);
  });

  it("weights dominant play share higher in profileWeightByMeta", () => {
    const [gameA, gameB] = [...gameinfo.values()].slice(0, 2);
    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      allRecs: [
        sampleRec(gameA.uid, gameA.name, "2024-01-01"),
        sampleRec(gameA.uid, gameA.name, "2024-01-02"),
        sampleRec(gameA.uid, gameA.name, "2024-01-03"),
        sampleRec(gameA.uid, gameA.name, "2024-01-04"),
        sampleRec(gameB.uid, gameB.name, "2024-01-05"),
      ],
    });

    const weightA = profile.profileWeightByMeta.get(gameA.uid) ?? 0;
    const weightB = profile.profileWeightByMeta.get(gameB.uid) ?? 0;
    expect(weightA).toBeGreaterThan(weightB);
    expect(weightA - weightB).toBeCloseTo(
      PROFILE_WEIGHTS.playShare * (0.8 - 0.2),
      5
    );
  });

  it("uses warm tier when logged in with two or more played games", () => {
    const [gameA, gameB] = [...gameinfo.values()].slice(0, 2);
    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      allRecs: [
        sampleRec(gameA.uid, gameA.name, "2024-01-01"),
        sampleRec(gameB.uid, gameB.name, "2024-01-02"),
      ],
    });
    expect(profile.tier).toBe("warm");
  });

  it("uses warm tier with one starred game and no plays", () => {
    const [gameA] = [...gameinfo.values()].slice(0, 1);
    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      starredIds: [gameA.uid],
      allRecs: [],
    });
    expect(profile.tier).toBe("warm");
  });

  it("uses cold tier when anonymous", () => {
    const [gameA, gameB] = [...gameinfo.values()].slice(0, 2);
    const profile = buildPlayerRecommendationProfile({
      userId: null,
      allRecs: [
        sampleRec(gameA.uid, gameA.name, "2024-01-01"),
        sampleRec(gameB.uid, gameB.name, "2024-01-02"),
      ],
    });
    expect(profile.tier).toBe("cold");
  });

  it("uses cold tier for sparse logged-in profile", () => {
    const [gameA] = [...gameinfo.values()].slice(0, 1);
    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      allRecs: [sampleRec(gameA.uid, gameA.name, "2024-01-01")],
    });
    expect(profile.tier).toBe("cold");
  });

  it("builds a non-empty taste vector from starred games", () => {
    const [gameA] = [...gameinfo.values()].slice(0, 1);
    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      starredIds: [gameA.uid],
      allRecs: [],
    });
    expect(profile.tasteVector.size).toBeGreaterThan(0);
    expect(profile.seedMetaGames).toContain(gameA.uid);
  });

  it("collects played meta games from records", () => {
    const [gameA] = [...gameinfo.values()].slice(0, 1);
    const rec = sampleRec(gameA.uid, gameA.name, "2024-01-01");
    expect(metaGameFromPlayerRecord(rec)).toBe(gameA.uid);

    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      allRecs: [rec],
      starredIds: [gameA.uid],
    });
    expect(profile.playedMetaGames.has(gameA.uid)).toBe(true);
  });
});
