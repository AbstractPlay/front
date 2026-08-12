import { vi } from "vitest";
import {
  maybeSyncInProgressCommentedFlag,
  runCheckTimeQuery,
} from "./spectatorHousekeeping";
import { getAuthToken, callAuthApi } from "../api";

vi.mock("../api", () => ({
  getAuthToken: vi.fn(),
  callAuthApi: vi.fn(),
}));

describe("spectatorHousekeeping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callAuthApi.mockResolvedValue({ status: 200 });
  });

  describe("maybeSyncInProgressCommentedFlag", () => {
    const baseArgs = {
      gameID: "game-1",
      metaGame: "carnac",
      game: { toMove: "0", commented: undefined },
      hasInterestingComments: true,
    };

    it("does not call callAuthApi when there is no auth token", async () => {
      getAuthToken.mockResolvedValue(null);

      await maybeSyncInProgressCommentedFlag(baseArgs);

      expect(callAuthApi).not.toHaveBeenCalled();
    });

    it("calls update_commented when authenticated and flag is out of sync", async () => {
      getAuthToken.mockResolvedValue("jwt-token");

      await maybeSyncInProgressCommentedFlag(baseArgs);

      expect(callAuthApi).toHaveBeenCalledWith(
        "update_commented",
        {
          id: "game-1",
          metaGame: "carnac",
          cbit: 0,
          commented: 1,
        },
        false
      );
    });

    it("skips update when commented flag already matches", async () => {
      getAuthToken.mockResolvedValue("jwt-token");

      await maybeSyncInProgressCommentedFlag({
        ...baseArgs,
        game: { toMove: "0", commented: 0 },
        hasInterestingComments: false,
      });

      expect(callAuthApi).not.toHaveBeenCalled();
    });
  });

  describe("runCheckTimeQuery", () => {
    it("does not call callAuthApi when there is no auth token", async () => {
      getAuthToken.mockResolvedValue(null);

      const result = await runCheckTimeQuery({
        query: "timeloss",
        gameId: "game-1",
        metaGame: "carnac",
      });

      expect(result).toBeNull();
      expect(callAuthApi).not.toHaveBeenCalled();
    });

    it("calls callAuthApi when authenticated", async () => {
      getAuthToken.mockResolvedValue("jwt-token");

      await runCheckTimeQuery({
        query: "abandoned",
        gameId: "game-1",
        metaGame: "carnac",
      });

      expect(callAuthApi).toHaveBeenCalledWith("abandoned", {
        id: "game-1",
        metaGame: "carnac",
      });
    });
  });
});
