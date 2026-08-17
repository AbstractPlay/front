import { primaryFontFamily } from "./embedExportFonts";

function setIfPresent(el, attr, value) {
  if (value == null || value === "") return;
  el.setAttribute(attr, value);
}

/**
 * Copy computed typography/paint from a live SVG onto an export clone.
 */
export function inlineTextStylesFromLive(liveRoot, cloneRoot) {
  if (!liveRoot || !cloneRoot) return;

  const liveTexts = liveRoot.querySelectorAll("text, tspan");
  const cloneTexts = cloneRoot.querySelectorAll("text, tspan");

  for (let i = 0; i < cloneTexts.length && i < liveTexts.length; i++) {
    const computed = window.getComputedStyle(liveTexts[i]);
    const el = cloneTexts[i];
    const family = primaryFontFamily(computed.fontFamily);

    setIfPresent(el, "font-family", family || computed.fontFamily);
    setIfPresent(el, "font-size", computed.fontSize);
    setIfPresent(el, "font-weight", computed.fontWeight);
    setIfPresent(el, "font-style", computed.fontStyle);
    setIfPresent(el, "letter-spacing", computed.letterSpacing);
    setIfPresent(el, "text-anchor", computed.textAnchor || el.getAttribute("text-anchor"));
    setIfPresent(el, "dominant-baseline", computed.dominantBaseline || el.getAttribute("dominant-baseline"));

    if (computed.fill && computed.fill !== "none") {
      setIfPresent(el, "fill", computed.fill);
    }
    if (computed.stroke && computed.stroke !== "none") {
      setIfPresent(el, "stroke", computed.stroke);
    }
    if (computed.opacity && computed.opacity !== "1") {
      setIfPresent(el, "opacity", computed.opacity);
    }
  }
}

/**
 * Inline computed styles for text in a mounted SVG (no live reference needed).
 */
export function inlineTextStylesFromMounted(svgRoot) {
  if (!svgRoot?.isConnected) return;
  for (const el of svgRoot.querySelectorAll("text, tspan")) {
    const computed = window.getComputedStyle(el);
    const family = primaryFontFamily(computed.fontFamily);
    setIfPresent(el, "font-family", family || computed.fontFamily);
    setIfPresent(el, "font-size", computed.fontSize);
    setIfPresent(el, "font-weight", computed.fontWeight);
    setIfPresent(el, "font-style", computed.fontStyle);
    setIfPresent(el, "letter-spacing", computed.letterSpacing);
    if (computed.fill && computed.fill !== "none") {
      setIfPresent(el, "fill", computed.fill);
    }
  }
}

/**
 * Copy renderer-authored <style> blocks from the live board SVG.
 */
export function copySvgStyleBlocks(sourceRoot, targetRoot) {
  if (!sourceRoot || !targetRoot) return;
  const styles = sourceRoot.querySelectorAll(":scope > style, defs > style");
  for (const styleEl of styles) {
    const clone = styleEl.cloneNode(true);
    targetRoot.insertBefore(clone, targetRoot.firstChild);
  }
}
