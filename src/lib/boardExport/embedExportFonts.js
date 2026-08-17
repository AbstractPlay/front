const GOOGLE_FONTS_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&family=Josefin+Sans:wght@400;600;700&display=swap";

const fontCssCache = new Map();

async function fetchAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${url}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function resolveFontUrl(href, cssUrl) {
  if (!href) return null;
  if (href.startsWith("data:")) return href;
  try {
    return new URL(href, cssUrl).href;
  } catch {
    return href;
  }
}

function extractFontFaceBlocks(cssText) {
  const blocks = [];
  const regex = /@font-face\s*\{([^}]+)\}/g;
  let match = regex.exec(cssText);
  while (match) {
    blocks.push(match[1]);
    match = regex.exec(cssText);
  }
  return blocks;
}

async function inlineFontFaceBlock(block, cssUrl) {
  const urlMatch = block.match(/url\(([^)]+)\)/);
  if (!urlMatch) return `@font-face { ${block} }`;
  const rawUrl = urlMatch[1].replace(/['"]/g, "");
  const absoluteUrl = resolveFontUrl(rawUrl, cssUrl);
  const dataUrl = await fetchAsDataUrl(absoluteUrl);
  const inlined = block.replace(urlMatch[0], `url(${dataUrl})`);
  return `@font-face { ${inlined} }`;
}

/**
 * Embed all faces from the site's Google Fonts stylesheet as data URLs.
 */
export async function buildEmbeddedExportFontCss() {
  if (fontCssCache.has(GOOGLE_FONTS_STYLESHEET)) {
    return fontCssCache.get(GOOGLE_FONTS_STYLESHEET);
  }

  const response = await fetch(GOOGLE_FONTS_STYLESHEET);
  if (!response.ok) {
    return "";
  }
  const cssText = await response.text();
  const blocks = extractFontFaceBlocks(cssText);
  const inlined = await Promise.all(
    blocks.map((block) => inlineFontFaceBlock(block, GOOGLE_FONTS_STYLESHEET))
  );
  const css = inlined.join("\n");
  fontCssCache.set(GOOGLE_FONTS_STYLESHEET, css);
  return css;
}

export function primaryFontFamily(fontFamily) {
  if (!fontFamily) return "";
  const first = fontFamily.split(",")[0]?.trim() ?? "";
  return first.replace(/^['"]|['"]$/g, "");
}

/**
 * Ensure faces referenced by SVG text are loaded in document.fonts before rasterize.
 */
export async function ensureFontsForSvg(svg) {
  await document.fonts.ready;
  const seen = new Set();
  const loads = [];

  for (const el of svg.querySelectorAll("text, tspan")) {
    const family = primaryFontFamily(
      el.getAttribute("font-family") || el.style?.fontFamily
    );
    if (!family) continue;

    const weight = el.getAttribute("font-weight") || "400";
    const style = el.getAttribute("font-style") || "normal";
    const sizeAttr = el.getAttribute("font-size") || "16";
    const size = parseFloat(sizeAttr) || 16;
    const key = `${style}|${weight}|${size}|${family}`;
    if (seen.has(key)) continue;
    seen.add(key);

    loads.push(
      document.fonts
        .load(`${style} ${weight} ${size}px "${family}"`)
        .catch(() => undefined)
    );
  }

  await Promise.all(loads);
  await document.fonts.ready;
}
