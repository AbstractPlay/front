import { describe, expect, it, afterEach } from "vitest";
import { layoutVisualViewportMismatch } from "./visualViewportFixedChrome";

describe("layoutVisualViewportMismatch", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalVisualViewport = window.visualViewport;

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport,
    });
  });

  it("returns false when visual viewport matches layout", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { width: 390, height: 800, offsetLeft: 0, offsetTop: 0, scale: 1 },
    });
    expect(layoutVisualViewportMismatch()).toBe(false);
  });

  it("returns true when DevTools-style width split (755 layout, 320 visual)", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 755,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 824,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { width: 320, height: 824, offsetLeft: 0, offsetTop: 0, scale: 1 },
    });
    expect(layoutVisualViewportMismatch()).toBe(true);
  });
});
