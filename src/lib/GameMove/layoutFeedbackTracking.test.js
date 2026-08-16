import { vi } from "vitest";
import {
  trackLayoutFeedback,
  trackLayoutFeedbackNote,
  trackLayoutSessionStart,
  trackLayoutSwitch,
} from "./layoutFeedbackTracking";
import { callAuthApi, getAuthToken } from "../api";
import { LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH } from "./layoutFeedbackConstants";

vi.mock("../api", () => ({
  getAuthToken: vi.fn(),
  callAuthApi: vi.fn(),
}));

describe("layoutFeedbackTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callAuthApi.mockResolvedValue({ status: 200 });
  });

  it("does not call the API when there is no auth token", async () => {
    getAuthToken.mockResolvedValue(null);

    trackLayoutSessionStart({ layoutId: "card", gameId: "g1" });
    await Promise.resolve();

    expect(callAuthApi).not.toHaveBeenCalled();
  });

  it("logs session_start with layoutId and gameId", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutSessionStart({ layoutId: "strip", gameId: "g1" });
    await Promise.resolve();

    expect(callAuthApi).toHaveBeenCalledWith(
      "log_layout_feedback_event",
      {
        event: "session_start",
        layoutId: "strip",
        gameId: "g1",
      },
      false
    );
  });

  it("logs feedback with rating only", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutFeedback({
      layoutId: "card",
      rating: "up",
      gameId: "g1",
      durationMs: 5000,
    });
    await Promise.resolve();

    expect(callAuthApi).toHaveBeenCalledWith(
      "log_layout_feedback_event",
      {
        event: "feedback",
        layoutId: "card",
        rating: "up",
        gameId: "g1",
        durationMs: 5000,
      },
      false
    );
  });

  it("logs feedback_note with trimmed comment", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutFeedbackNote({
      layoutId: "narrative",
      comment: "  Great layout  ",
      gameId: "g1",
    });
    await Promise.resolve();

    expect(callAuthApi).toHaveBeenCalledWith(
      "log_layout_feedback_event",
      {
        event: "feedback_note",
        layoutId: "narrative",
        comment: "Great layout",
        gameId: "g1",
      },
      false
    );
  });

  it("rejects empty feedback_note comments client-side", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutFeedbackNote({ layoutId: "card", comment: "   " });
    await Promise.resolve();

    expect(callAuthApi).not.toHaveBeenCalled();
  });

  it("rejects over-max feedback_note comments client-side", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutFeedbackNote({
      layoutId: "card",
      comment: "x".repeat(LAYOUT_FEEDBACK_MAX_COMMENT_LENGTH + 1),
    });
    await Promise.resolve();

    expect(callAuthApi).not.toHaveBeenCalled();
  });

  it("logs layout_switch with toLayoutId", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutSwitch({
      layoutId: "strip",
      toLayoutId: "card",
      gameId: "g1",
    });
    await Promise.resolve();

    expect(callAuthApi).toHaveBeenCalledWith(
      "log_layout_feedback_event",
      {
        event: "layout_switch",
        layoutId: "strip",
        toLayoutId: "card",
        gameId: "g1",
      },
      false
    );
  });
});
