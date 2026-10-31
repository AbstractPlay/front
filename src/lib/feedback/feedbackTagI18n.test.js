import { describe, expect, it } from "vitest";
import {
  feedbackTagDescKey,
  feedbackTagDescription,
  feedbackTagLabel,
  feedbackTagLabelKey,
} from "./feedbackTagI18n";

describe("feedbackTagI18n", () => {
  it("builds stable i18n keys", () => {
    expect(feedbackTagLabelKey("game_client")).to.equal("feedback.tag.game_client");
    expect(feedbackTagDescKey("game_client")).to.equal("feedback.tagDesc.game_client");
  });

  it("returns label with slug fallback", () => {
    const t = (key, opts) => (opts?.defaultValue ?? key);
    expect(feedbackTagLabel(t, "custom_slug")).to.equal("custom_slug");
  });

  it("returns description only when a string is defined", () => {
    const t = (key) => {
      if (key === "feedback.tagDesc.dashboard") {
        return "Home dashboard";
      }
      return key;
    };
    expect(feedbackTagDescription(t, "dashboard")).to.equal("Home dashboard");
    expect(feedbackTagDescription(t, "unknown_slug")).to.be.undefined;
  });
});
