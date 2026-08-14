import { vi } from "vitest";
import {
  trackRecommendationClick,
  trackRecommendationShow,
} from "./recommendationTracking";
import { callAuthApi, getAuthToken } from "./api";

vi.mock("./api", () => ({
  getAuthToken: vi.fn(),
  callAuthApi: vi.fn(),
}));

describe("recommendationTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callAuthApi.mockResolvedValue({ status: 200 });
  });

  describe("trackRecommendationShow", () => {
    const baseArgs = {
      batchId: "batch-1",
      surface: "gamePicker",
      tier: "warm",
      recommendations: [
        { id: "go", reasonType: "content" },
        { id: "hex", reasonType: "popularity" },
      ],
    };

    it("does not call the API when there is no auth token", async () => {
      getAuthToken.mockResolvedValue(null);

      trackRecommendationShow(baseArgs);
      await Promise.resolve();

      expect(callAuthApi).not.toHaveBeenCalled();
    });

    it("logs rec_show with parallel gameIds and reasons arrays", async () => {
      getAuthToken.mockResolvedValue("jwt-token");

      trackRecommendationShow(baseArgs);
      await Promise.resolve();

      expect(callAuthApi).toHaveBeenCalledWith(
        "log_recommendation_event",
        {
          event: "rec_show",
          batchId: "batch-1",
          surface: "gamePicker",
          tier: "warm",
          gameIds: ["go", "hex"],
          reasons: ["content", "popularity"],
        },
        false
      );
    });

    it("skips empty recommendation lists", async () => {
      getAuthToken.mockResolvedValue("jwt-token");

      trackRecommendationShow({ ...baseArgs, recommendations: [] });
      await Promise.resolve();

      expect(callAuthApi).not.toHaveBeenCalled();
    });
  });

  describe("trackRecommendationClick", () => {
    it("logs rec_click with position and reasonType", async () => {
      getAuthToken.mockResolvedValue("jwt-token");

      trackRecommendationClick({
        batchId: "batch-1",
        surface: "gamePicker",
        tier: "cold",
        metaGame: "amazons",
        position: 2,
        reasonType: "cooccur",
      });
      await Promise.resolve();

      expect(callAuthApi).toHaveBeenCalledWith(
        "log_recommendation_event",
        {
          event: "rec_click",
          batchId: "batch-1",
          surface: "gamePicker",
          tier: "cold",
          metaGame: "amazons",
          position: 2,
          reasonType: "cooccur",
        },
        false
      );
    });
  });
});
