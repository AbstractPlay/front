import { describe, expect, it } from "vitest";
import { apAttKeysInBody, resolveAnnouncementImages } from "./resolveAnnouncementImages";

describe("resolveAnnouncementImages", () => {
  it("rewrites ap-att keys to URLs", () => {
    const body = "Hello\n\n![img](ap-att:import/1/a.png)";
    const out = resolveAnnouncementImages(body, {
      "import/1/a.png": "https://cdn.example/a.png",
    });
    expect(out).toContain("https://cdn.example/a.png");
    expect(out).not.toContain("ap-att:");
  });

  it("leaves unknown keys unchanged", () => {
    const body = "![x](ap-att:missing)";
    expect(resolveAnnouncementImages(body, {})).toBe(body);
  });
});

describe("apAttKeysInBody", () => {
  it("finds keys in markdown", () => {
    expect(apAttKeysInBody("![a](ap-att:k1) and ![b](ap-att:k2)")).toEqual(["k1", "k2"]);
  });
});
