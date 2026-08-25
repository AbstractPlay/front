import { describe, expect, it } from "vitest";
import {
  buildGlickoByGameMap,
  compareByGlickoLow,
  formatGlickoConfidenceRange,
  formatGlickoLowWithRd,
  formatGlickoSiteLowWithRd,
  glickoRatingLow,
  glickoSiteRatingLow,
} from "./glickoDisplay";

describe("glickoRatingLow", () => {
  it("uses ratingLow when present", () => {
    expect(glickoRatingLow({ rating: 1600, rd: 50, ratingLow: 1700 })).toBe(
      1700
    );
  });

  it("falls back to rating - 2*rd", () => {
    expect(glickoRatingLow({ rating: 1600, rd: 50 })).toBe(1500);
  });
});

describe("glickoSiteRatingLow", () => {
  it("uses site rating - 2*rd, not stored ratingLow", () => {
    expect(
      glickoSiteRatingLow({
        rating: 1445,
        rd: 244.75648131033873,
        ratingLow: 999,
      })
    ).toBe(1445 - 2 * 244.75648131033873);
  });
});

describe("buildGlickoByGameMap", () => {
  it("keys rows by user and game", () => {
    const map = buildGlickoByGameMap([
      {
        user: "u1",
        game: "Chess",
        glicko: { rating: 1500, rd: 40, ratingLow: 1420 },
      },
    ]);
    expect(map.get("u1|Chess")).toEqual({
      rating: 1500,
      rd: 40,
      ratingLow: 1420,
    });
  });
});

describe("formatGlickoLowWithRd", () => {
  it("formats rounded low and rd", () => {
    expect(
      formatGlickoLowWithRd({ rating: 1600, rd: 49.2, ratingLow: 1800.4 })
    ).toBe("1800 (49)");
  });
});

describe("formatGlickoSiteLowWithRd", () => {
  it("formats site composite from rating - 2*rd", () => {
    expect(
      formatGlickoSiteLowWithRd({
        rating: 1445.008128525005,
        rd: 244.75648131033873,
        ratingLow: 955.4951659043276,
      })
    ).toBe("955 (245)");
  });
});

describe("compareByGlickoLow", () => {
  it("orders by conservative low bound", () => {
    const a = { rating: 1320, rd: 60, ratingLow: 1200 };
    const b = { rating: 1250, rd: 80, ratingLow: 1090 };
    expect(compareByGlickoLow(a, b)).toBeGreaterThan(0);
  });

  it("breaks ties by lower RD", () => {
    const a = { rating: 1300, rd: 50, ratingLow: 1200 };
    const b = { rating: 1400, rd: 100, ratingLow: 1200 };
    expect(compareByGlickoLow(a, b)).toBeLessThan(0);
  });
});

describe("formatGlickoConfidenceRange", () => {
  it("formats 95% range from rating and rd", () => {
    expect(
      formatGlickoConfidenceRange({ rating: 1600, rd: 50 })
    ).toBe("1500–1700");
  });
});
