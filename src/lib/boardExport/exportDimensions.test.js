import { describe, expect, it } from "vitest";
import {
  computeContainRect,
  EXPORT_CANVAS_WIDTH,
  EXPORT_CANVAS_HEIGHT,
  EXPORT_DPI,
} from "./exportDimensions";
import { delaySecToGifMs } from "./encodeAnimatedGif";

describe("exportDimensions", () => {
  it("uses a 1920x1280 export canvas", () => {
    expect(EXPORT_CANVAS_WIDTH).toBe(1920);
    expect(EXPORT_CANVAS_HEIGHT).toBe(1280);
    expect(EXPORT_DPI).toBeGreaterThanOrEqual(72);
  });

  it("letterboxes a wide board inside the export canvas", () => {
    const fit = computeContainRect(800, 400, 1920, 1280);
    expect(fit.width).toBe(1920);
    expect(fit.height).toBe(960);
    expect(fit.x).toBe(0);
    expect(fit.y).toBe(160);
  });

  it("pillarboxes a tall board inside the export canvas", () => {
    const fit = computeContainRect(400, 800, 1920, 1280);
    expect(fit.width).toBe(640);
    expect(fit.height).toBe(1280);
    expect(fit.x).toBe(640);
    expect(fit.y).toBe(0);
  });
});

describe("encodeAnimatedGif timing", () => {
  it("converts seconds to gifenc milliseconds", () => {
    expect(delaySecToGifMs(1)).toBe(1000);
    expect(delaySecToGifMs(0.5)).toBe(500);
  });
});
