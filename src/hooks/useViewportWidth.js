import { useEffect, useState } from "react";
import { NARROW_VIEWPORT_MEDIA, readViewportWidth } from "../lib/viewport";

/**
 * Subscribes to viewport width changes (resize, orientation, visual viewport, matchMedia).
 */
export function useViewportWidth() {
  const [width, setWidth] = useState(() => readViewportWidth());

  useEffect(() => {
    const update = () => setWidth(readViewportWidth());
    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);

    const media = window.matchMedia(NARROW_VIEWPORT_MEDIA);
    media.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      vv?.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, []);

  return width;
}
