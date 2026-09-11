import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY } from "../../csp-policy.mjs";

function directive(name) {
  const match = CONTENT_SECURITY_POLICY.match(new RegExp(`${name}\\s+([^;]+)`));
  return match?.[1] ?? "";
}

describe("csp-policy board export", () => {
  it("allows blob URLs for rasterization and downloads", () => {
    expect(directive("default-src")).toContain("blob:");
    expect(directive("img-src")).toContain("blob:");
    expect(directive("img-src")).toContain("data:");
  });

  it("allows font and board asset fetches used during export", () => {
    const connect = directive("connect-src");
    expect(connect).toContain("https://fonts.googleapis.com");
    expect(connect).toContain("https://fonts.gstatic.com");
    expect(connect).toContain("https://thumbnails.abstractplay.com");
    expect(connect).toContain("blob:");
  });

  it("allows feedback attachment bucket for presigned upload and preview", () => {
    const connect = directive("connect-src");
    const img = directive("img-src");
    expect(connect).toContain("https://ap-feedback-attachments-dev.s3.us-east-1.amazonaws.com");
    expect(img).toContain("https://ap-feedback-attachments-dev.s3.us-east-1.amazonaws.com");
  });

  it("allows embedded export fonts to load in rasterized SVG", () => {
    const fontSrc = directive("font-src");
    expect(fontSrc).toContain("https://fonts.gstatic.com");
    expect(fontSrc).toContain("data:");
  });
});
