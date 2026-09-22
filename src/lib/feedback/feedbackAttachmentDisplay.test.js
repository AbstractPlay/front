import { describe, expect, it } from "vitest";
import {
  feedbackAttachmentFilename,
  isFeedbackImageAttachmentKey,
} from "./feedbackAttachmentDisplay";

describe("feedbackAttachmentDisplay", () => {
  it("detects image keys by extension", () => {
    expect(isFeedbackImageAttachmentKey("staging/user/uuid.png")).toBe(true);
    expect(isFeedbackImageAttachmentKey("post/comments/c1/uuid.webp")).toBe(true);
    expect(isFeedbackImageAttachmentKey("staging/user/uuid.txt")).toBe(false);
    expect(isFeedbackImageAttachmentKey("staging/user/uuid.json")).toBe(false);
  });

  it("extracts filename from key", () => {
    expect(feedbackAttachmentFilename("staging/uid/abc-123.json")).toBe("abc-123.json");
  });
});
