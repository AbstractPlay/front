import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSummaryFetchInflight,
  getPlayerTimeoutStats,
  mergePlayersSummary,
  mergeRatingsSummary,
  mergeSiteSummary,
  summaryFromPlayerSlice,
  unwrapTierPayload,
} from "./summaryFetch";
import { useStore } from "../stores";

describe("unwrapTierPayload", () => {
  it("strips tier wrapper fields", () => {
    expect(
      unwrapTierPayload({
        generated: "2026-01-01",
        tier: "site",
        numGames: 10,
      })
    ).toEqual({ numGames: 10 });
  });
});

describe("mergeSiteSummary", () => {
  it("merges site fields into summary", () => {
    const merged = mergeSiteSummary(null, { numGames: 5, numPlayers: 2 });
    expect(merged).toEqual({ numGames: 5, numPlayers: 2 });
  });
});

describe("mergePlayersSummary", () => {
  it("merges players and histogram slices", () => {
    const merged = mergePlayersSummary(
      { histograms: { all: [1] } },
      {
        players: { h: [{ user: "a", value: 1 }] },
        histograms: {
          players: [{ user: "a", value: [0, 1] }],
          playerTimeouts: [],
        },
      }
    );
    expect(merged.players.h).toEqual([{ user: "a", value: 1 }]);
    expect(merged.histograms.all).toEqual([1]);
    expect(merged.histograms.players).toEqual([{ user: "a", value: [0, 1] }]);
  });
});

describe("mergeRatingsSummary", () => {
  it("merges ratings slice", () => {
    const merged = mergeRatingsSummary(null, {
      ratings: { highest: [{ user: "a", game: "Go", rating: 1500 }] },
    });
    expect(merged.ratings.highest).toHaveLength(1);
  });
});

describe("summaryFromPlayerSlice", () => {
  it("builds minimal summary for quick picks", () => {
    const summary = summaryFromPlayerSlice({
      user: "u1",
      ratings: {
        highest: [{ user: "u1", game: "Chess", rating: 1600 }],
        avg: 1550,
      },
    });
    expect(summary?.ratings?.highest).toHaveLength(1);
    expect(summary?.ratings?.avg).toEqual([{ user: "u1", rating: 1550 }]);
  });
});

describe("getPlayerTimeoutStats", () => {
  it("reads timeoutStats aggregates", () => {
    const stats = getPlayerTimeoutStats(
      {
        players: {
          timeoutStats: [{ user: "u1", count: 3, latestTimeoutMs: 1000 }],
        },
      },
      "u1"
    );
    expect(stats).toEqual({ user: "u1", count: 3, latestTimeoutMs: 1000 });
  });

  it("falls back to legacy per-event timeouts", () => {
    const stats = getPlayerTimeoutStats(
      {
        players: {
          timeouts: [
            { user: "u1", value: 500 },
            { user: "u1", value: 900 },
          ],
        },
      },
      "u1"
    );
    expect(stats).toEqual({ user: "u1", count: 2, latestTimeoutMs: 900 });
  });
});

describe("ensureSummary tiers", () => {
  beforeEach(() => {
    clearSummaryFetchInflight();
    useStore.setState({
      summary: null,
      summaryLoadState: "idle",
      summarySiteLoadState: "idle",
      summaryPlayersLoadState: "idle",
      summaryRatingsLoadState: "idle",
    });
  });

  it("marks site tier ready after successful fetch", async () => {
    const sitePayload = {
      generated: "t",
      tier: "site",
      numGames: 42,
      numPlayers: 7,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sitePayload,
    });

    const { ensureSummarySite } = await import("./summaryFetch");
    await ensureSummarySite();

    const state = useStore.getState();
    expect(state.summarySiteLoadState).toBe("ready");
    expect(state.summaryLoadState).toBe("ready");
    expect(state.summary?.numGames).toBe(42);
  });
});
