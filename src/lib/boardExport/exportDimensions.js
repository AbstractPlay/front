/** Fixed raster size for board exports (PNG + GIF frames). */
export const EXPORT_CANVAS_WIDTH = 1920;
export const EXPORT_CANVAS_HEIGHT = 1280;
export const EXPORT_DPI = 72;

/**
 * Fit source rect inside destination while preserving aspect ratio (contain).
 */
export function computeContainRect(srcWidth, srcHeight, dstWidth, dstHeight) {
  const safeSrcW = Math.max(1, srcWidth);
  const safeSrcH = Math.max(1, srcHeight);
  const scale = Math.min(dstWidth / safeSrcW, dstHeight / safeSrcH);
  const width = safeSrcW * scale;
  const height = safeSrcH * scale;
  return {
    x: (dstWidth - width) / 2,
    y: (dstHeight - height) / 2,
    width,
    height,
  };
}
