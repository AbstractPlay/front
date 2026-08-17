import { prepareSvgForRaster } from "./prepareSvgForRaster";
import {
  EXPORT_CANVAS_WIDTH,
  EXPORT_CANVAS_HEIGHT,
  EXPORT_DPI,
  computeContainRect,
} from "./exportDimensions";
import { setPngDpi } from "./setPngDpi";

function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToBlob(canvas) {
  if (canvas.convertToBlob) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed"));
    }, "image/png");
  });
}

function drawSvgOnCanvas(
  ctx,
  img,
  srcWidth,
  srcHeight,
  canvasWidth,
  canvasHeight,
  background
) {
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  const fit = computeContainRect(
    srcWidth,
    srcHeight,
    canvasWidth,
    canvasHeight
  );
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, fit.x, fit.y, fit.width, fit.height);
}

async function loadSvgImage(svg) {
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to rasterize SVG"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function rasterizeSvgToCanvas(svg, { liveSvg, background, metaGame } = {}) {
  const { svg: prepared, width: srcWidth, height: srcHeight } =
    await prepareSvgForRaster(svg, { liveSvg, metaGame });
  const canvas = createCanvas(EXPORT_CANVAS_WIDTH, EXPORT_CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }
  const img = await loadSvgImage(prepared);
  drawSvgOnCanvas(
    ctx,
    img,
    srcWidth,
    srcHeight,
    EXPORT_CANVAS_WIDTH,
    EXPORT_CANVAS_HEIGHT,
    background
  );
  return { canvas, width: EXPORT_CANVAS_WIDTH, height: EXPORT_CANVAS_HEIGHT };
}

export async function svgToPngBlob(svg, { background, liveSvg, metaGame } = {}) {
  const { canvas } = await rasterizeSvgToCanvas(svg, {
    background,
    liveSvg,
    metaGame,
  });
  const blob = await canvasToBlob(canvas);
  return setPngDpi(blob, EXPORT_DPI);
}

export async function svgToImageData(svg, { background, liveSvg, metaGame } = {}) {
  const { canvas, width, height } = await rasterizeSvgToCanvas(svg, {
    background,
    liveSvg,
    metaGame,
  });
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, width, height);
  return { imageData, width, height };
}
