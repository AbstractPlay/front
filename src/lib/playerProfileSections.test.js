import { describe, expect, it } from "vitest";
import { getTopRatings } from "./playerProfileSections";

describe("getTopRatings", () => {
  const summary = {
    ratings: {
      highest: [
        {
          user: "u1",
          game: "Chess (no variants)",
          rating: 1280,
          glicko: { rating: 1250, rd: 80, ratingLow: 1090 },
        },
        {
          user: "u1",
          game: "Go (9x9|handicap)",
          rating: 1400,
          glicko: { rating: 1380, rd: 90, ratingLow: 1200 },
        },
        {
          user: "u1",
          game: "Hive",
          rating: 1500,
          glicko: { rating: 1480, rd: 40, ratingLow: 1400 },
        },
      ],
    },
  };

  it("returns top games by conservative Glicko, not Elo", () => {
    const top = getTopRatings(summary, "u1", 3);
    expect(top.map((r) => r.game)).toEqual([
      "Hive",
      "Go (9x9|handicap)",
      "Chess (no variants)",
    ]);
    expect(top[0]?.glickoLow).toBe(1400);
  });

  it("respects limit", () => {
    expect(getTopRatings(summary, "u1", 1)).toHaveLength(1);
  });

  it("returns empty for missing user", () => {
    expect(getTopRatings(summary, "nobody", 3)).toEqual([]);
  });
});
