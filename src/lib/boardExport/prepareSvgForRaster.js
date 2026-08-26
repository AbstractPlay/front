import {
  buildEmbeddedExportFontCss,
  ensureFontsForSvg,
} from "./embedExportFonts";
import {
  copySvgStyleBlocks,
  inlineTextStylesFromLive,
  inlineTextStylesFromMounted,
} from "./inlineSvgTextStyles";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const imageDataCache = new Map();

function normalizeFetchUrl(url) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep original URL when parsing fails.
  }
  return url;
}

async function fetchAsDataUrl(url) {
  const fetchUrl = normalizeFetchUrl(url);
  if (imageDataCache.has(fetchUrl)) {
    return imageDataCache.get(fetchUrl);
  }
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${url}`);
  }
  const blob = await response.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  imageDataCache.set(fetchUrl, dataUrl);
  return dataUrl;
}

function getHref(element) {
  return (
    element.getAttribute("href") ||
    element.getAttributeNS(XLINK_NS, "href") ||
    element.getAttribute("xlink:href")
  );
}

function setHref(element, value) {
  element.setAttribute("href", value);
  element.setAttributeNS(XLINK_NS, "href", value);
}

async function inlineImages(root) {
  const images = root.querySelectorAll("image");
  await Promise.all(
    [...images].map(async (img) => {
      const href = getHref(img);
      if (!href || href.startsWith("data:")) return;
      try {
        const dataUrl = await fetchAsDataUrl(href);
        setHref(img, dataUrl);
      } catch {
        // Leave external reference if fetch fails.
      }
    })
  );
}

function injectFontCss(svg, fontCss) {
  if (!fontCss) return;
  const style = document.createElementNS(SVG_NS, "style");
  style.textContent = fontCss;
  svg.insertBefore(style, svg.firstChild);
}

function ensureSvgDimensions(svg) {
  const viewBox = svg.getAttribute("viewBox");
  let width = parseFloat(svg.getAttribute("width"));
  let height = parseFloat(svg.getAttribute("height"));

  if ((!width || !height) && viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    }
  }

  if (!width || !height) {
    width = 800;
    height = 800;
  }

  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  if (!viewBox) {
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  return { width, height };
}

function createBoardMount(metaGame) {
  const mount = document.createElement("div");
  mount.className = metaGame ? `board _meta_${metaGame}` : "board";
  mount.style.position = "absolute";
  mount.style.left = "-9999px";
  mount.style.top = "0";
  mount.style.visibility = "hidden";
  mount.style.width = "1000px";
  mount.style.height = "1000px";
  document.body.appendChild(mount);
  return mount;
}

/**
 * Clone SVG, inline assets/fonts, and return export-ready SVG + dimensions.
 */
export async function prepareSvgForRaster(
  svg,
  { liveSvg, metaGame, useLiveStyles = true } = {}
) {
  if (!svg) {
    throw new Error("No SVG to export");
  }

  await document.fonts.ready;

  const mount = createBoardMount(metaGame);
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("xmlns:xlink", XLINK_NS);
  mount.appendChild(clone);

  if (useLiveStyles && liveSvg?.isConnected) {
    copySvgStyleBlocks(liveSvg, clone);
    inlineTextStylesFromLive(liveSvg, clone);
  }

  await inlineImages(clone);

  const fontCss = await buildEmbeddedExportFontCss();
  injectFontCss(clone, fontCss);

  // Resolve typography from mounted board context when live copy is unavailable.
  inlineTextStylesFromMounted(clone);
  await ensureFontsForSvg(clone);

  const { width, height } = ensureSvgDimensions(clone);
  mount.removeChild(clone);
  document.body.removeChild(mount);

  return { svg: clone, width, height };
}
