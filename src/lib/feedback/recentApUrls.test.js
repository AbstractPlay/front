import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatApUrlLabel,
  getRecentApUrlsForBugReport,
  isFeedbackNewFormUrl,
  parseGameHintsFromApUrl,
  recordApUrl,
  resolveInitialRelevantPageSelection,
} from "./recentApUrls";

describe("recentApUrls", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { origin: "https://play.abstractplay.com" },
    });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records and dedupes same-origin URLs", () => {
    recordApUrl("https://play.abstractplay.com/move/chess/abc/game-1");
    recordApUrl("https://play.abstractplay.com/explore");
    recordApUrl("https://play.abstractplay.com/move/chess/abc/game-1");
    const recent = getRecentApUrlsForBugReport();
    expect(recent).toHaveLength(2);
    expect(recent[0]).toContain("/move/");
    expect(recent[1]).toContain("/explore");
  });

  it("excludes bug report form URLs from suggestions", () => {
    recordApUrl("https://play.abstractplay.com/feedback/new?kind=bug");
    recordApUrl("https://play.abstractplay.com/me");
    expect(getRecentApUrlsForBugReport()).toEqual([
      "https://play.abstractplay.com/me",
    ]);
  });

  it("ignores other origins", () => {
    recordApUrl("https://evil.example.com/move/1");
    expect(getRecentApUrlsForBugReport()).toEqual([]);
  });

  it("formatApUrlLabel shows path and query", () => {
    expect(formatApUrlLabel("https://play.abstractplay.com/move/x/y/z?foo=1"))
      .toBe("/move/x/y/z?foo=1");
  });

  it("parseGameHintsFromApUrl reads move path game id", () => {
    expect(parseGameHintsFromApUrl(
      "https://play.abstractplay.com/move/hive/1/444727048",
    )).toEqual({ gameId: "444727048" });
  });

  it("isFeedbackNewFormUrl matches bug report form paths", () => {
    expect(isFeedbackNewFormUrl("https://play.abstractplay.com/feedback/new?kind=bug"))
      .toBe(true);
    expect(isFeedbackNewFormUrl("https://play.abstractplay.com/move/druid/0/x"))
      .toBe(false);
  });

  it("resolveInitialRelevantPageSelection prefers pageUrl query param", () => {
    const move = "https://play.abstractplay.com/move/druid/0/game-1";
    const params = new URLSearchParams({ pageUrl: move });
    expect(resolveInitialRelevantPageSelection(params, [])).toEqual({
      pageChoice: "custom",
      customPageUrl: move,
    });
    expect(resolveInitialRelevantPageSelection(params, [move])).toEqual({
      pageChoice: move,
      customPageUrl: "",
    });
  });
});
