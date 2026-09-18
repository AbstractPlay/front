import { describe, expect, it } from "vitest";
import { resolveNewsFeedBootstrapKey } from "./announcementFeedConfig";

describe("resolveNewsFeedBootstrapKey", () => {
  it("waits while auth is unresolved", () => {
    expect(resolveNewsFeedBootstrapKey("unknown", null)).toBeNull();
    expect(resolveNewsFeedBootstrapKey("loading", null)).toBeNull();
  });

  it("loads as guest when signed out", () => {
    expect(resolveNewsFeedBootstrapKey("guest", null)).toBe("guest");
  });

  it("waits for profile when signed in", () => {
    expect(resolveNewsFeedBootstrapKey("ready", null)).toBeNull();
    expect(resolveNewsFeedBootstrapKey("ready", { id: "user-1" })).toBe("user-1");
  });
});
