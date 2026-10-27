/** Bulma tablet breakpoint — `.columns` flex from this width up (see `myBulma.css`). */
export const BULMA_TABLET_MIN_PX = 769;

/** Same as Bulma `(max-width: 768px)` for narrow / mobile layout. */
export const NARROW_VIEWPORT_MEDIA = "(max-width: 768px)";

/**
 * Layout width for play-page breakpoints. Prefer `visualViewport` when available
 * so JS layout matches the painted viewport on mobile browsers.
 */
export function readViewportWidth() {
  if (typeof window === "undefined") {
    return BULMA_TABLET_MIN_PX;
  }
  const vv = window.visualViewport;
  if (vv && typeof vv.width === "number" && vv.width > 0) {
    return Math.round(vv.width);
  }
  return window.innerWidth;
}

/** True when width is below Bulma’s tablet breakpoint (stacked columns / card layout). */
export function isNarrowViewport(width) {
  return width < BULMA_TABLET_MIN_PX;
}

export function matchNarrowViewport() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(NARROW_VIEWPORT_MEDIA).matches;
}
