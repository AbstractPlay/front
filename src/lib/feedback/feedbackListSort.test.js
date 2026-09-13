import { afterEach, describe, expect, it } from "vitest";
import {
  getStoredFeedbackAdminSort,
  getStoredFeedbackBoardSort,
  isValidFeedbackBoardSort,
  setStoredFeedbackAdminSort,
  setStoredFeedbackBoardSort,
} from "./feedbackListSort";

describe("feedbackListSort", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    expect(getStoredFeedbackBoardSort("bug")).toBe("recent");
    expect(getStoredFeedbackBoardSort("feature")).toBe("votes");
    expect(getStoredFeedbackBoardSort("wishlist")).toBe("votes");
    expect(getStoredFeedbackAdminSort("feature")).toBe("default");
  });

  it("persists and restores board sort per kind", () => {
    setStoredFeedbackBoardSort("bug", "votes");
    setStoredFeedbackBoardSort("wishlist", "name");
    expect(getStoredFeedbackBoardSort("bug")).toBe("votes");
    expect(getStoredFeedbackBoardSort("wishlist")).toBe("name");
    expect(getStoredFeedbackBoardSort("feature")).toBe("votes");
  });

  it("rejects admin-only board sorts for non-admin readers", () => {
    setStoredFeedbackBoardSort("feature", "priority");
    expect(getStoredFeedbackBoardSort("feature", { isAdmin: false })).toBe("votes");
    expect(getStoredFeedbackBoardSort("feature", { isAdmin: true })).toBe("priority");
  });

  it("validates board sort options", () => {
    expect(isValidFeedbackBoardSort("wishlist", "name")).toBe(true);
    expect(isValidFeedbackBoardSort("bug", "priority", { isAdmin: false })).toBe(false);
    expect(isValidFeedbackBoardSort("bug", "priority", { isAdmin: true })).toBe(true);
  });

  it("persists admin list sort per kind", () => {
    setStoredFeedbackAdminSort("bug", "status");
    setStoredFeedbackAdminSort("feature", "priority");
    expect(getStoredFeedbackAdminSort("bug")).toBe("status");
    expect(getStoredFeedbackAdminSort("feature")).toBe("priority");
  });
});
