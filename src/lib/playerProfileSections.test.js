import { describe, expect, it } from "vitest";
import { gameinfo } from "@abstractplay/gameslib";
import { getPlayerSiteGlicko, getTopRatings } from "./playerProfileSections";

describe("getTopRatings", () => {
  const hiveEntry = [...gameinfo.entries()].find(([uid]) => uid !== "go");

  const summary = {
    ratings: {
      highest: [
        {
          user: "u1",
          game: "go (no variants)",
          rating: 1280,
          glicko: { rating: 1250, rd: 80, ratingLow: 1090 },
        },
        {
          user: "u1",
          game: "go (9x9|handicap)",
          rating: 1400,
          glicko: { rating: 1380, rd: 90, ratingLow: 1200 },
        },
        ...(hiveEntry
          ? [
              {
                user: "u1",
                game: hiveEntry[0],
                rating: 1500,
                glicko: { rating: 1480, rd: 40, ratingLow: 1400 },
              },
            ]
          : []),
      ],
    },
  };

  it("returns top games by conservative Glicko, not Elo", () => {
    const top = getTopRatings(summary, "u1", 3);
    const expectedOrder = [
      hiveEntry ? hiveEntry[0] : "go (9x9|handicap)",
      hiveEntry ? "go (9x9|handicap)" : "go (no variants)",
      hiveEntry ? "go (no variants)" : undefined,
    ].filter(Boolean);
    expect(top.map((r) => r.game)).toEqual(expectedOrder);
    expect(top[0]?.glickoLow).toBe(hiveEntry ? 1400 : 1200);
  });

  it("respects limit", () => {
    expect(getTopRatings(summary, "u1", 1)).toHaveLength(1);
  });

  it("returns empty for missing user", () => {
    expect(getTopRatings(summary, "nobody", 3)).toEqual([]);
  });
});

describe("getPlayerSiteGlicko", () => {
  it("returns site composite entry for user", () => {
    const summary = {
      ratings: {
        glickoSite: [
          { user: "u1", rating: 1500, rd: 200 },
          { user: "u2", rating: 1400, rd: 180 },
        ],
      },
    };
    expect(getPlayerSiteGlicko(summary, "u1")).toEqual({
      user: "u1",
      rating: 1500,
      rd: 200,
    });
  });

  it("returns null when user has no site Glicko", () => {
    const summary = {
      ratings: {
        glickoSite: [{ user: "u2", rating: 1400, rd: 180 }],
      },
    };
    expect(getPlayerSiteGlicko(summary, "u1")).toBeNull();
  });
});
