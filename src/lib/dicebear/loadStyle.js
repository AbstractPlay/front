import { Style } from "@dicebear/core";
import { isAllowedAvatarStyle } from "./allowlist";

const styleLoaders = {
  blobs: () => import("@dicebear/styles/blobs.json"),
  glass: () => import("@dicebear/styles/glass.json"),
  rings: () => import("@dicebear/styles/rings.json"),
  identicon: () => import("@dicebear/styles/identicon.json"),
  "initial-face": () => import("@dicebear/styles/initial-face.json"),
  patchwork: () => import("@dicebear/styles/patchwork.json"),
  "shape-grid": () => import("@dicebear/styles/shape-grid.json"),
  shapes: () => import("@dicebear/styles/shapes.json"),
  waves: () => import("@dicebear/styles/waves.json"),
  cameo: () => import("@dicebear/styles/cameo.json"),
  clay: () => import("@dicebear/styles/clay.json"),
  cutouts: () => import("@dicebear/styles/cutouts.json"),
  constellation: () => import("@dicebear/styles/constellation.json"),
  landscape: () => import("@dicebear/styles/landscape.json"),
  planets: () => import("@dicebear/styles/planets.json"),
};

const styleCache = new Map();

export async function loadAvatarStyle(styleId) {
  if (!isAllowedAvatarStyle(styleId)) {
    throw new Error(`Unknown avatar style: ${styleId}`);
  }
  if (styleCache.has(styleId)) {
    return styleCache.get(styleId);
  }
  const loader = styleLoaders[styleId];
  const mod = await loader();
  const style = new Style(mod.default);
  styleCache.set(styleId, style);
  return style;
}

export function preloadAvatarStyles(styleIds) {
  return Promise.all(styleIds.map((styleId) => loadAvatarStyle(styleId)));
}
