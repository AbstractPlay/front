import { GIFEncoder, quantize, applyPalette } from "gifenc";

/** gifenc `delay` option is milliseconds (not centiseconds). */
export function delaySecToGifMs(delaySec) {
  return Math.max(20, Math.round((delaySec ?? 1) * 1000));
}

/**
 * Encode RGBA frames as an animated GIF.
 * @param {Array<{ imageData: ImageData, width: number, height: number }>} frames
 * @param {number} delaySec delay between frames in seconds
 */
export function encodeAnimatedGif(frames, delaySec) {
  if (!frames?.length) {
    throw new Error("No frames to encode");
  }

  const delayMs = delaySecToGifMs(delaySec);
  const gif = GIFEncoder();
  const { width, height } = frames[0];

  for (const frame of frames) {
    if (frame.width !== width || frame.height !== height) {
      throw new Error("GIF frames must share dimensions");
    }
    const rgba = frame.imageData.data;
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, width, height, { palette, delay: delayMs });
  }

  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}
