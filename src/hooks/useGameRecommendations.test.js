import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearGameRecommendationsCache,
  fetchCooccur,
} from "./useGameRecommendations";

describe("fetchCooccur", () => {
  beforeEach(() => {
    clearGameRecommendationsCache();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON on success", async () => {
    const payload = {
      generatedAt: "2026-08-13T00:00:00Z",
      games: { go: [{ metaGame: "amazons", pmi: 1.2, count: 10 }] },
    };
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    await expect(fetchCooccur()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      "https://records.abstractplay.com/recommendations/cooccur.json"
    );
  });

  it("returns null on HTTP error without throwing", async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(fetchCooccur()).resolves.toBeNull();
    await expect(fetchCooccur()).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns null on network error and caches failure", async () => {
    fetch.mockRejectedValue(new Error("offline"));

    await expect(fetchCooccur()).resolves.toBeNull();
    await expect(fetchCooccur()).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
