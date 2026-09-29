import React from "react";
import {
  buildStatusGlyphRenderOptions,
  renderStatusGlyphSvg,
  statusGlyphAlt,
} from "./renderStatusGlyph.js";

export function StatusGlyphImage({ value, id, globalMe, colourContext, game }) {
  const options = buildStatusGlyphRenderOptions({
    id,
    game,
    globalMe,
    colourContext,
  });
  const svg = renderStatusGlyphSvg(value, options);
  return (
    <img
      className="statusGlyphImage"
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt={statusGlyphAlt(value)}
    />
  );
}
