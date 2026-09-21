import { describe, expect, it } from "vitest";
import {
  RECENT_GAMES_DAY_OPTIONS,
  RECENT_GAMES_DEFAULT_DAYS,
  normalizeRecentGamesDays,
} from "./recentGamesSections";

describe("normalizeRecentGamesDays", () => {
  it("accepts 7 and 30", () => {
    expect(normalizeRecentGamesDays(7)).toBe(7);
    expect(normalizeRecentGamesDays(30)).toBe(30);
    expect(normalizeRecentGamesDays("30")).toBe(30);
  });

  it("clamps removed 90-day option to default", () => {
    expect(normalizeRecentGamesDays(90)).toBe(RECENT_GAMES_DEFAULT_DAYS);
  });

  it("falls back to default for invalid values", () => {
    expect(normalizeRecentGamesDays(0)).toBe(RECENT_GAMES_DEFAULT_DAYS);
    expect(normalizeRecentGamesDays(45)).toBe(RECENT_GAMES_DEFAULT_DAYS);
    expect(normalizeRecentGamesDays(undefined)).toBe(RECENT_GAMES_DEFAULT_DAYS);
  });
});

describe("RECENT_GAMES_DAY_OPTIONS", () => {
  it("lists only 7 and 30", () => {
    expect(RECENT_GAMES_DAY_OPTIONS).toEqual([7, 30]);
  });
});
