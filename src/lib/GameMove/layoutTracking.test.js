import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANON_EVENTS_PER_DAY,
  getAnonymousLayoutEventCount,
  getLayoutSessionId,
  trackLayoutSessionStart,
  trackLayoutSwitch,
} from "./layoutTracking";
import { callAuthApi, getAuthToken } from "../api";

vi.mock("../api", () => ({
  getAuthToken: vi.fn(),
  callAuthApi: vi.fn(),
}));

describe("layoutTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    callAuthApi.mockResolvedValue({ status: 200 });
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
  });

  it("reuses a single session id per page load", () => {
    const first = getLayoutSessionId();
    const second = getLayoutSessionId();
    expect(first).toBe(second);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("logs session_start via auth API when logged in", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutSessionStart({
      layoutId: "strip",
      resolvedFrom: "default",
      metaGame: "amazons",
      storedLayout: "card",
    });
    await Promise.resolve();

    expect(callAuthApi).toHaveBeenCalledWith(
      "log_gamemove_layout_event",
      expect.objectContaining({
        event: "session_start",
        layout: "strip",
        resolvedFrom: "default",
        metaGame: "amazons",
        storedLayout: "card",
        sessionId: getLayoutSessionId(),
      }),
      false
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("logs layout_switch via auth API when logged in", async () => {
    getAuthToken.mockResolvedValue("jwt-token");

    trackLayoutSwitch({
      from: "strip",
      to: "classic",
      resolvedFrom: "localStorage",
      metaGame: "go",
    });
    await Promise.resolve();

    expect(callAuthApi).toHaveBeenCalledWith(
      "log_gamemove_layout_event",
      expect.objectContaining({
        event: "layout_switch",
        from: "strip",
        to: "classic",
        layout: "classic",
      }),
      false
    );
  });

  it("uses public API for anonymous users until daily cap", async () => {
    getAuthToken.mockResolvedValue(null);

    trackLayoutSessionStart({
      layoutId: "strip",
      resolvedFrom: "default",
      metaGame: "amazons",
    });
    await Promise.resolve();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getAnonymousLayoutEventCount()).toBe(1);
  });

  it("stops anonymous emits after 25 events in a UTC day", async () => {
    getAuthToken.mockResolvedValue(null);
    const dateKey = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      `gameMoveLayoutEventCount-${dateKey}`,
      String(ANON_EVENTS_PER_DAY)
    );

    trackLayoutSessionStart({
      layoutId: "strip",
      resolvedFrom: "default",
      metaGame: "amazons",
    });
    await Promise.resolve();

    expect(fetch).not.toHaveBeenCalled();
    expect(getAnonymousLayoutEventCount()).toBe(ANON_EVENTS_PER_DAY);
  });
});
