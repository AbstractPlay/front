import { describe, expect, it } from "vitest";
import { buildFeedbackReplyDraft } from "./feedbackQuoteMarkdown";

describe("buildFeedbackReplyDraft", () => {
  it("quotes each line of the body with author attribution", () => {
    const draft = buildFeedbackReplyDraft({
      authorName: "Alice",
      body: "First line\nSecond line",
    });
    expect(draft).toBe(
      "> **Alice** wrote:\n> First line\n> Second line\n\n",
    );
  });

  it("uses emptyText when the source has no body", () => {
    const draft = buildFeedbackReplyDraft({
      authorName: "Bob",
      body: "",
      emptyText: "_(no text)_",
    });
    expect(draft).toBe("> **Bob** wrote:\n> _(no text)_\n\n");
  });

  it("ends with blank lines so the author can continue typing", () => {
    const draft = buildFeedbackReplyDraft({ authorName: "Carol", body: "Hi" });
    expect(draft.endsWith("\n\n")).toBe(true);
  });
});
