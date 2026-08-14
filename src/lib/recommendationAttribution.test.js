import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECOMMENDATION_ATTRIBUTION_KEY,
  clearRecommendationAttribution,
  maybeTrackRecommendationChallenge,
  readRecommendationAttribution,
  saveRecommendationAttribution,
} from "./recommendationAttribution";
import { trackRecommendationChallenge } from "./recommendationTracking";

vi.mock("./recommendationTracking", () => ({
  trackRecommendationChallenge: vi.fn(),
}));

describe("recommendationAttribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("saves and reads attribution from sessionStorage", () => {
    saveRecommendationAttribution({
      batchId: "batch-1",
      surface: "gamePicker",
      tier: "warm",
      metaGame: "go",
    });

    expect(readRecommendationAttribution()).toEqual({
      batchId: "batch-1",
      surface: "gamePicker",
      tier: "warm",
      metaGame: "go",
    });
    expect(sessionStorage.getItem(RECOMMENDATION_ATTRIBUTION_KEY)).toBeTruthy();
  });

  it("clears attribution", () => {
    saveRecommendationAttribution({
      batchId: "batch-1",
      surface: "gamePicker",
      tier: "warm",
      metaGame: "go",
    });
    clearRecommendationAttribution();
    expect(readRecommendationAttribution()).toBeNull();
  });

  it("fires rec_challenge and clears when metaGame matches", () => {
    saveRecommendationAttribution({
      batchId: "batch-1",
      surface: "gamePicker",
      tier: "cold",
      metaGame: "hex",
    });

    maybeTrackRecommendationChallenge("hex");

    expect(trackRecommendationChallenge).toHaveBeenCalledWith({
      batchId: "batch-1",
      surface: "gamePicker",
      tier: "cold",
      metaGame: "hex",
    });
    expect(readRecommendationAttribution()).toBeNull();
  });

  it("clears without firing when metaGame mismatches", () => {
    saveRecommendationAttribution({
      batchId: "batch-1",
      surface: "gamePicker",
      tier: "warm",
      metaGame: "go",
    });

    maybeTrackRecommendationChallenge("hex");

    expect(trackRecommendationChallenge).not.toHaveBeenCalled();
    expect(readRecommendationAttribution()).toBeNull();
  });

  it("does nothing when storage is empty", () => {
    maybeTrackRecommendationChallenge("go");
    expect(trackRecommendationChallenge).not.toHaveBeenCalled();
  });
});
