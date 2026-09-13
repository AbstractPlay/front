import { describe, expect, it } from "vitest";
import {
  batchRatingGameKeyForMeta,
  batchRatingGameLabel,
  buildHighestGlickoMap,
  defaultGlickoPrior,
  glicko2ExpectedScore,
  lookupGlickoForPool,
  matchWinRateForChallenge,
  passesMatchCompetitivenessFilter,
} from "./glickoMatchOdds";

describe("batchRatingGameLabel", () => {
  it("matches backend-crons summarize keys (meta UID prefix)", () => {
    expect(batchRatingGameLabel("chess", [])).toBe("chess (no variants)");
    expect(batchRatingGameLabel("go", ["9x9", "handicap"].sort())).toBe(
      "go (9x9|handicap)"
    );
  });
});

describe("defaultGlickoPrior", () => {
  it("uses site start rating and RD", () => {
    const prior = defaultGlickoPrior();
    expect(prior.rating).toBe(1200);
    expect(prior.rd).toBe(350);
  });
});

describe("lookupGlickoForPool", () => {
  it("returns prior when user never played that pool", () => {
    const map = buildHighestGlickoMap([
      {
        user: "alice",
        game: "chess (no variants)",
        glicko: { rating: 1320, rd: 60 },
      },
    ]);
    const glicko = lookupGlickoForPool(map, "bob", "chess (no variants)");
    expect(glicko.rating).toBe(1200);
    expect(glicko.rd).toBe(350);
  });

  it("does not use another game pool for the same user", () => {
    const map = buildHighestGlickoMap([
      {
        user: "alice",
        game: "chess (no variants)",
        glicko: { rating: 1600, rd: 50 },
      },
    ]);
    const glicko = lookupGlickoForPool(map, "alice", "go (9x9|handicap)");
    expect(glicko.rating).toBe(1200);
  });
});

describe("glicko2ExpectedScore", () => {
  it("is near 0.5 for equal priors", () => {
    const prior = defaultGlickoPrior();
    const p = glicko2ExpectedScore(prior, prior);
    expect(p).toBeGreaterThan(0.49);
    expect(p).toBeLessThan(0.51);
  });

  it("favors the higher-rated player", () => {
    const strong = { rating: 1600, rd: 80 };
    const weak = { rating: 1200, rd: 80 };
    expect(glicko2ExpectedScore(strong, weak)).toBeGreaterThan(0.5);
    expect(glicko2ExpectedScore(weak, strong)).toBeLessThan(0.5);
  });

  it("uses prior for absent user vs established opponent", () => {
    const prior = defaultGlickoPrior();
    const opp = { rating: 1250, rd: 80 };
    const p = glicko2ExpectedScore(prior, opp);
    expect(p).toBeLessThan(0.5);
    expect(p).toBeGreaterThan(0.35);
  });
});

describe("matchWinRateForChallenge", () => {
  const gameKey = batchRatingGameKeyForMeta("chess", [], 2);
  const map = buildHighestGlickoMap([
    {
      user: "alice",
      game: gameKey,
      glicko: { rating: 1320, rd: 60 },
    },
    {
      user: "bob",
      game: gameKey,
      glicko: { rating: 1250, rd: 80 },
    },
  ]);

  it("returns null for unrated challenges", () => {
    expect(
      matchWinRateForChallenge({
        highestMap: map,
        userId: "alice",
        challengerId: "bob",
        metaUid: "chess",
        variantUids: [],
        numPlayers: 2,
        rated: false,
      })
    ).toBeNull();
  });

  it("computes rate for rated pool", () => {
    const p = matchWinRateForChallenge({
      highestMap: map,
      userId: "alice",
      challengerId: "bob",
      metaUid: "chess",
      variantUids: [],
      numPlayers: 2,
      rated: true,
    });
    expect(p).toBeGreaterThan(0.5);
  });
});

describe("passesMatchCompetitivenessFilter", () => {
  it("applies ideal and good bands", () => {
    expect(passesMatchCompetitivenessFilter(0.5, "all")).toBe(true);
    expect(passesMatchCompetitivenessFilter(0.5, "ideal")).toBe(true);
    expect(passesMatchCompetitivenessFilter(0.5, "good")).toBe(true);
    expect(passesMatchCompetitivenessFilter(0.6, "ideal")).toBe(false);
    expect(passesMatchCompetitivenessFilter(0.6, "good")).toBe(true);
    expect(passesMatchCompetitivenessFilter(0.7, "good")).toBe(false);
  });
});

describe("batchRatingGameKeyForMeta", () => {
  it("builds summarize keys from meta uid", () => {
    expect(batchRatingGameKeyForMeta("chess", [], 2)).toBe("chess (no variants)");
  });
});
