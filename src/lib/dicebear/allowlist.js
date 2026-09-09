export const DEFAULT_AVATAR_STYLE = "identicon";

export const AVATAR_STYLES = [
  "blobs",
  "glass",
  "rings",
  "identicon",
  "initial-face",
  "patchwork",
  "shape-grid",
  "shapes",
  "waves",
  "cameo",
  "clay",
  "cutouts",
  "constellation",
  "landscape",
  "planets",
];

const STYLE_SET = new Set(AVATAR_STYLES);

export function isAllowedAvatarStyle(style) {
  return typeof style === "string" && STYLE_SET.has(style);
}
