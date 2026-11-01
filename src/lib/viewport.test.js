import { describe, expect, it, afterEach } from "vitest";
import {
  BULMA_TABLET_MIN_PX,
  isNarrowViewport,
  isNarrowViewportForLayout,
  isPageZoomActive,
  matchNarrowViewport,
  readLayoutViewportWidth,
  readViewportWidth,
} from "./viewport";

function mockViewport({ innerWidth, vv }) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: innerWidth,
  });
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: vv,
  });
}

describe("viewport", () => {
  const originalInnerWidth = window.innerWidth;
  const originalVisualViewport = window.visualViewport;

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport,
    });
  });

  it("isNarrowViewport aligns with Bulma max-width 768px", () => {
    expect(isNarrowViewport(768)).toBe(true);
    expect(isNarrowViewport(BULMA_TABLET_MIN_PX)).toBe(false);
  });

  it("readLayoutViewportWidth prefers visualViewport.width on mobile (scale 1)", () => {
    mockViewport({
      innerWidth: 1024,
      vv: { width: 390, scale: 1 },
    });
    expect(readLayoutViewportWidth()).toBe(390);
    expect(readViewportWidth()).toBe(390);
  });

  it("readLayoutViewportWidth falls back to innerWidth without visualViewport", () => {
    mockViewport({
      innerWidth: 412,
      vv: undefined,
    });
    expect(readLayoutViewportWidth()).toBe(412);
  });

  it("uses innerWidth when page zoom shrinks visualViewport on a desktop window", () => {
    mockViewport({
      innerWidth: 1280,
      vv: { width: 640, scale: 2 },
    });
    expect(isPageZoomActive(window.visualViewport)).toBe(true);
    expect(readLayoutViewportWidth()).toBe(1280);
    expect(isNarrowViewportForLayout()).toBe(false);
  });

  it("still uses visualViewport when page zoom on a genuinely narrow window", () => {
    mockViewport({
      innerWidth: 700,
      vv: { width: 583, scale: 1.2 },
    });
    expect(readLayoutViewportWidth()).toBe(583);
    expect(isNarrowViewportForLayout()).toBe(true);
  });

  it("uses visualViewport when zoomed on a phone-sized innerWidth", () => {
    mockViewport({
      innerWidth: 390,
      vv: { width: 195, scale: 2 },
    });
    expect(readLayoutViewportWidth()).toBe(195);
    expect(isNarrowViewportForLayout()).toBe(true);
  });

  it("matchNarrowViewport uses layout width (ignores zoom-shrunk vv on desktop)", () => {
    mockViewport({
      innerWidth: 1280,
      vv: { width: 640, scale: 2 },
    });
    expect(matchNarrowViewport()).toBe(false);
    mockViewport({
      innerWidth: 390,
      vv: { width: 390, scale: 1 },
    });
    expect(matchNarrowViewport()).toBe(true);
  });
});
