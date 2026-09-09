import { Avatar } from "@dicebear/core";
import { loadAvatarStyle } from "./loadStyle";

/** Let the container control rendered size; intrinsic SVG dimensions fight CSS scaling. */
export function fitAvatarSvgToContainer(svg) {
  const stripped = svg
    .replace(/\swidth="[^"]*"/, "")
    .replace(/\sheight="[^"]*"/, "")
    .replace(/\spreserveAspectRatio="[^"]*"/, "");
  return stripped.replace(
    "<svg",
    '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"'
  );
}

export async function createAvatarSvg({ style, seed, size }) {
  const styleInstance = await loadAvatarStyle(style);
  const options = { seed };
  if (size !== undefined) {
    options.size = size;
  }
  return fitAvatarSvgToContainer(new Avatar(styleInstance, options).toString());
}
