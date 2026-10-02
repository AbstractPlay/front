import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchNotifications = vi.fn();
const getState = vi.fn();

vi.mock("./globalMeBootstrap", () => ({
  fetchNotifications: (...args) => fetchNotifications(...args),
}));

vi.mock("../stores", () => ({
  useStore: {
    getState: () => getState(),
  },
}));

describe("scheduleNotificationsRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchNotifications.mockReset();
    getState.mockReturnValue({ globalMe: { id: "user-1" } });
  });

  afterEach(async () => {
    const { cancelScheduledNotificationsRefresh } = await import(
      "./scheduleNotificationsRefresh.js"
    );
    cancelScheduledNotificationsRefresh();
    vi.useRealTimers();
    vi.resetModules();
  });

  it("debounces fetchNotifications", async () => {
    const { scheduleNotificationsRefresh } = await import(
      "./scheduleNotificationsRefresh.js"
    );

    scheduleNotificationsRefresh();
    scheduleNotificationsRefresh();
    expect(fetchNotifications).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(fetchNotifications).toHaveBeenCalledTimes(1);
  });

  it("skips fetch when not logged in", async () => {
    getState.mockReturnValue({ globalMe: null });
    const { scheduleNotificationsRefresh } = await import(
      "./scheduleNotificationsRefresh.js"
    );

    scheduleNotificationsRefresh();
    vi.advanceTimersByTime(400);
    expect(fetchNotifications).not.toHaveBeenCalled();
  });
});
