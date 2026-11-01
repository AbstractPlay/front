/** Bulma tablet breakpoint — `.columns` flex from this width up (see `myBulma.css`). */
export const BULMA_TABLET_MIN_PX = 769;

/** Same as Bulma `(max-width: 768px)` for narrow / mobile layout. */
export const NARROW_VIEWPORT_MEDIA = "(max-width: 768px)";

/** Pinch / Ctrl+ zoom raises `visualViewport.scale` above 1. */
export const PAGE_ZOOM_SCALE_THRESHOLD = 1.01;

function visualViewportScale(vv) {
  if (!vv || typeof vv.scale !== "number" || !Number.isFinite(vv.scale)) {
    return 1;
  }
  return vv.scale;
}

/** True when the user has page zoom active (not merely a narrow window). */
export function isPageZoomActive(vv = typeof window !== "undefined" ? window.visualViewport : null) {
  return visualViewportScale(vv) > PAGE_ZOOM_SCALE_THRESHOLD;
}

/**
 * Layout width for play-page breakpoints. Prefer `visualViewport` when available
 * so JS layout matches the painted viewport on mobile browsers.
 *
 * When page zoom shrinks `visualViewport.width` on a desktop-sized window, use
 * `innerWidth` so layout does not flip to phone/card mode (WCAG 1.4.4).
 */
export function readLayoutViewportWidth() {
  if (typeof window === "undefined") {
    return BULMA_TABLET_MIN_PX;
  }
  const vv = window.visualViewport;
  const inner = window.innerWidth;

  if (
    isPageZoomActive(vv) &&
    typeof inner === "number" &&
    inner >= BULMA_TABLET_MIN_PX
  ) {
    return Math.round(inner);
  }

  if (vv && typeof vv.width === "number" && vv.width > 0) {
    return Math.round(vv.width);
  }
  return Math.round(inner);
}

export function readViewportWidth() {
  return readLayoutViewportWidth();
}

/** True when width is below Bulma’s tablet breakpoint (stacked columns / card layout). */
export function isNarrowViewport(width) {
  return width < BULMA_TABLET_MIN_PX;
}

/** Narrow play layout using {@link readLayoutViewportWidth}. */
export function isNarrowViewportForLayout() {
  return isNarrowViewport(readLayoutViewportWidth());
}

export function matchNarrowViewport() {
  if (typeof window === "undefined") {
    return false;
  }
  return isNarrowViewport(readLayoutViewportWidth());
}
