/**
 * True when fixed UI pinned to the layout viewport would miss the painted
 * visual viewport (DevTools device mode, zoom, mobile browser chrome).
 */
export function layoutVisualViewportMismatch() {
  if (typeof window === "undefined") {
    return false;
  }
  const vv = window.visualViewport;
  if (!vv) {
    return false;
  }
  return (
    Math.abs(Math.round(vv.width) - window.innerWidth) > 1 ||
    Math.abs(Math.round(vv.height) - window.innerHeight) > 1 ||
    Math.abs(vv.offsetLeft) > 0.5 ||
    Math.abs(vv.offsetTop) > 0.5
  );
}

/**
 * Pin a fixed bottom bar to the visual viewport when it diverges from layout.
 * Clears inline overrides when viewports match.
 */
export function applyVisualViewportFixedBottom(el, extraBottomPx = 0) {
  if (!el) {
    return;
  }
  if (!layoutVisualViewportMismatch()) {
    el.style.removeProperty("left");
    el.style.removeProperty("width");
    el.style.removeProperty("right");
    el.style.removeProperty("bottom");
    return;
  }
  const vv = window.visualViewport;
  if (!vv) {
    return;
  }
  const gapBelowVisual = window.innerHeight - (vv.offsetTop + vv.height);
  el.style.left = `${vv.offsetLeft}px`;
  el.style.width = `${vv.width}px`;
  el.style.right = "auto";
  el.style.bottom = `${Math.max(0, gapBelowVisual) + extraBottomPx}px`;
}

export function readStepperBottomOffsetPx(el) {
  if (!el || typeof window === "undefined") {
    return 0;
  }
  const raw = getComputedStyle(el).getPropertyValue("--game-move-stepper-bottom").trim();
  if (!raw) {
    return 0;
  }
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.bottom = raw;
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).bottom) || 0;
  probe.remove();
  return px;
}
