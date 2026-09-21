import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureBugContext } from "./feedbackContext";

describe("captureBugContext", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        href: "https://play.abstractplay.com/feedback/new?kind=bug&pageUrl=https%3A%2F%2Fplay.abstractplay.com%2Fmove%2Fdruid%2F0%2Fabc",
        origin: "https://play.abstractplay.com",
      },
      innerWidth: 100,
      innerHeight: 200,
    });
    vi.stubGlobal("navigator", { userAgent: "test-agent" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores only the selected relevant page URL, not the bug form", () => {
    const moveUrl = "https://play.abstractplay.com/move/druid/0/abc";
    const context = captureBugContext(new URLSearchParams("gameId=abc"), {
      reportedPageUrl: moveUrl,
    });
    expect(context.pageUrl).toBe(moveUrl);
  });

  it("omits pageUrl when no relevant page was selected", () => {
    const context = captureBugContext(new URLSearchParams("gameId=abc"), {
      reportedPageUrl: "",
    });
    expect(context.pageUrl).toBeUndefined();
    expect(context.gameId).toBe("abc");
  });

  it("still reads game hints from pageUrl query when none selected on form", () => {
    const moveUrl = "https://play.abstractplay.com/move/druid/0/from-query";
    const params = new URLSearchParams({
      pageUrl: moveUrl,
    });
    const context = captureBugContext(params, { reportedPageUrl: "" });
    expect(context.pageUrl).toBeUndefined();
    expect(context.gameId).toBe("from-query");
  });
});
