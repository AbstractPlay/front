import { describe, expect, it } from "vitest";
import { clockDisplayNow } from "./clockDisplayNow.js";

describe("clockDisplayNow", () => {
  it("uses session live clock when ticking", () => {
    expect(
      clockDisplayNow({ liveClockTicking: true, liveClockNow: 42_000 })
    ).toBe(42_000);
  });

  it("falls back to wall clock when not ticking", () => {
    const before = Date.now();
    const value = clockDisplayNow({ liveClockTicking: false, liveClockNow: 1 });
    expect(value).toBeGreaterThanOrEqual(before);
  });
});
