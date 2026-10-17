import { describe, expect, it } from "vitest";
import { parseThumbnailJson, thumbnailJsonUrl } from "./thumbnailArtifact";

describe("thumbnailArtifact", () => {
  it("thumbnailJsonUrl", () => {
    expect(thumbnailJsonUrl("hive")).toBe(
      "https://thumbnails.abstractplay.com/hive.json",
    );
  });

  it("parseThumbnailJson unwraps v1 envelope", () => {
    const render = { board: {}, legend: {}, pieces: "" };
    const source = {
      metaGame: "go",
      gameId: "g1",
      cbit: "0",
      sampleKind: "active",
      generatedAt: "2026-10-17T00:00:00.000Z",
      moveUrl: "https://play.abstractplay.com/move/go/0/g1",
    };
    const parsed = parseThumbnailJson({ v: 1, source, render });
    expect(parsed.source).toEqual(source);
    expect(parsed.render).toEqual(render);
  });

  it("parseThumbnailJson legacy bare rep", () => {
    const legacy = { board: { style: "squares" }, legend: {}, pieces: "A" };
    const parsed = parseThumbnailJson(legacy);
    expect(parsed.source).toBeNull();
    expect(parsed.render).toEqual(legacy);
  });
});
