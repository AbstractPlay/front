import { describe, expect, it, afterEach } from "vitest";
import {
  BULMA_TABLET_MIN_PX,
  isNarrowViewport,
  readViewportWidth,
} from "./viewport";

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

  it("readViewportWidth prefers visualViewport.width when set", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { width: 390 },
    });
    expect(readViewportWidth()).toBe(390);
  });

  it("readViewportWidth falls back to innerWidth", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 412,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined,
    });
    expect(readViewportWidth()).toBe(412);
  });
});
