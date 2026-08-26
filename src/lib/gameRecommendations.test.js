import { describe, expect, it } from "vitest";
import {
  buildGameRecommendations,
  computeRecencyScore,
  lookupCooccurScore,
  selectWithGoalDiversityCap,
} from "./gameRecommendations";
import { buildPlayerRecommendationProfile } from "./playerRecommendationProfile";

const REFERENCE_DATE = new Date("2026-08-13T12:00:00Z");

const testCatalog = [
  {
    id: "connect-a",
    name: "Connect A",
    categories: ["goal>connect", "mechanic>place"],
    dateAdded: "2026-01-01",
  },
  {
    id: "connect-b",
    name: "Connect B",
    categories: ["goal>connect", "mechanic>place"],
    dateAdded: "2026-01-01",
  },
  {
    id: "connect-c",
    name: "Connect C",
    categories: ["goal>connect", "mechanic>place"],
    dateAdded: "2026-01-01",
  },
  {
    id: "area-a",
    name: "Area A",
    categories: ["goal>area", "mechanic>capture"],
    dateAdded: "2026-01-01",
  },
  {
    id: "area-b",
    name: "Area B",
    categories: ["goal>area", "mechanic>capture"],
    dateAdded: "2026-01-01",
  },
  {
    id: "score-a",
    name: "Score A",
    categories: ["goal>score>race", "mechanic>move"],
    dateAdded: "2026-01-01",
  },
  {
    id: "new-connect",
    name: "New Connect",
    categories: ["goal>connect", "mechanic>place"],
    dateAdded: "2026-08-12",
  },
  {
    id: "old-connect",
    name: "Old Connect",
    categories: ["goal>connect", "mechanic>place"],
    dateAdded: "2024-01-01",
  },
];

function warmProfileForConnectPlayer() {
  return buildPlayerRecommendationProfile({
    userId: "user-1",
    starredIds: ["agere"],
    allRecs: [],
    summary: null,
  });
}

describe("computeRecencyScore", () => {
  it("scores higher for newer games on the recency curve", () => {
    const recent = computeRecencyScore("2026-08-12", REFERENCE_DATE);
    const mid = computeRecencyScore("2026-06-13", REFERENCE_DATE);
    const old = computeRecencyScore("2024-01-01", REFERENCE_DATE);
    expect(recent).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(old);
    expect(old).toBe(0);
  });

  it("returns zero after the new-game window", () => {
    expect(computeRecencyScore("2025-01-01", REFERENCE_DATE)).toBe(0);
  });
});

describe("selectWithGoalDiversityCap", () => {
  it("caps selections per top-level goal bucket", () => {
    const ranked = [
      { id: "1", score: 1, goalBucket: "goal>connect" },
      { id: "2", score: 0.9, goalBucket: "goal>connect" },
      { id: "3", score: 0.8, goalBucket: "goal>connect" },
      { id: "4", score: 0.7, goalBucket: "goal>area" },
    ];
    const selected = selectWithGoalDiversityCap(ranked, 4, 2);
    expect(selected.map((item) => item.id)).toEqual(["1", "2", "4"]);
  });
});

describe("lookupCooccurScore", () => {
  it("aggregates PMI from seed games", () => {
    const cooccurData = {
      games: {
        "connect-a": [{ metaGame: "area-a", pmi: 1.5, count: 10 }],
      },
    };
    const result = lookupCooccurScore("area-a", ["connect-a"], cooccurData);
    expect(result.score).toBe(1.5);
    expect(result.bestSeed).toBe("connect-a");
  });
});

describe("buildGameRecommendations", () => {
  it("excludes already-played games", () => {
    const profile = buildPlayerRecommendationProfile({
      userId: "user-1",
      starredIds: ["agere"],
      allRecs: [
        {
          header: {
            game: { name: "Connect B" },
            site: { gameid: "connect-b#1" },
            "date-end": "2026-01-01",
          },
        },
      ],
    });
    const recs = buildGameRecommendations({
      profile,
      catalog: testCatalog,
      referenceDate: REFERENCE_DATE,
      limit: 8,
    });
    expect(recs.some((game) => game.id === "connect-b")).toBe(false);
  });

  it("applies goal diversity cap in warm tier", () => {
    const profile = warmProfileForConnectPlayer();
    const recs = buildGameRecommendations({
      profile,
      catalog: testCatalog,
      referenceDate: REFERENCE_DATE,
      limit: 4,
    });
    const connectCount = recs.filter((game) =>
      game.id.startsWith("connect-")
    ).length;
    expect(connectCount).toBeLessThanOrEqual(2);
    expect(recs.length).toBe(4);
  });

  it("boosts co-occurrence in hybrid ranking", () => {
    const profile = warmProfileForConnectPlayer();
    const cooccurData = {
      games: {
        agere: [{ metaGame: "area-a", pmi: 5, count: 20 }],
      },
    };
    const without = buildGameRecommendations({
      profile,
      catalog: testCatalog,
      cooccurData: null,
      referenceDate: REFERENCE_DATE,
      limit: 8,
    });
    const withCooccur = buildGameRecommendations({
      profile,
      catalog: testCatalog,
      cooccurData,
      referenceDate: REFERENCE_DATE,
      limit: 8,
    });
    const areaWithout = without.find((game) => game.id === "area-a");
    const areaWith = withCooccur.find((game) => game.id === "area-a");
    expect(areaWith).toBeDefined();
    expect(areaWith?.score ?? 0).toBeGreaterThan(areaWithout?.score ?? 0);
    expect(areaWith?.reasonType).toBe("cooccur");
  });

  it("returns cold-tier popularity and new-game picks for anonymous users", () => {
    const profile = buildPlayerRecommendationProfile({
      userId: null,
      allRecs: [],
    });
    const recs = buildGameRecommendations({
      profile,
      catalog: testCatalog,
      popularityData: {
        moves1w: [
          { metaGame: "area-a", score: 100 },
          { metaGame: "connect-a", score: 50 },
        ],
      },
      referenceDate: REFERENCE_DATE,
      limit: 4,
    });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((game) => game.reason.length > 0)).toBe(true);
  });

  it("provides non-empty reasons for each recommendation", () => {
    const profile = warmProfileForConnectPlayer();
    const recs = buildGameRecommendations({
      profile,
      catalog: testCatalog,
      referenceDate: REFERENCE_DATE,
      limit: 5,
    });
    for (const rec of recs) {
      expect(rec.reason).toBeTruthy();
      expect(rec.reasonType).toBeTruthy();
    }
  });

  it("prefers newer unplayed connect games via recency curve", () => {
    const profile = warmProfileForConnectPlayer();
    const recs = buildGameRecommendations({
      profile,
      catalog: [
        {
          id: "new-connect",
          name: "New Connect",
          categories: ["goal>connect"],
          dateAdded: "2026-08-12",
        },
        {
          id: "old-connect",
          name: "Old Connect",
          categories: ["goal>connect"],
          dateAdded: "2024-01-01",
        },
        {
          id: "area-a",
          name: "Area A",
          categories: ["goal>area"],
          dateAdded: "2026-01-01",
        },
      ],
      referenceDate: REFERENCE_DATE,
      limit: 2,
    });
    const newPick = recs.find((game) => game.id === "new-connect");
    const oldPick = recs.find((game) => game.id === "old-connect");
    if (newPick && oldPick) {
      expect(newPick.score).toBeGreaterThan(oldPick.score);
    } else {
      expect(newPick).toBeDefined();
    }
  });
});
