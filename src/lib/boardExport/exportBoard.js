import { buildBoardRenderOptions } from "./buildBoardRenderOptions";
import { renderBoardSvg } from "./renderBoardSvg";
import { svgToPngBlob, svgToImageData } from "./svgToPngBlob";
import { encodeAnimatedGif } from "./encodeAnimatedGif";
import { buildFrameRenderRep } from "./buildFrameRenderReps";
import {
  getPathToFocus,
  slicePathFrames,
  MAX_GIF_FRAMES,
} from "./enumeratePathFrames";
import { boardGifFilename, boardPngFilename } from "./boardExportFilename";
import { triggerDownload } from "./downloadBlob";

function pickRenderRep(renderrep, boardRenderIndex) {
  if (renderrep == null) return null;
  const reps = Array.isArray(renderrep) ? renderrep : [renderrep];
  if (reps.length === 0) return null;
  let index = boardRenderIndex;
  if (index == null || Number.isNaN(index) || index < 0 || index >= reps.length) {
    index = reps.length - 1;
  }
  return reps[index];
}

function getLiveSvg(boardRenderIndex, rendered) {
  if (!rendered?.length) return null;
  let index = boardRenderIndex;
  if (index == null || Number.isNaN(index) || index < 0 || index >= rendered.length) {
    index = rendered.length - 1;
  }
  const node = rendered[index];
  return node?.tagName?.toLowerCase() === "svg" ? node : node?.querySelector?.("svg");
}

export async function exportCurrentBoardPng({
  renderrep,
  boardRenderIndex,
  rendered,
  metaGame,
  gameId,
  settings,
  colourContext,
  globalMe,
  isParticipant,
}) {
  const rep = pickRenderRep(renderrep, boardRenderIndex);
  if (!rep) {
    throw new Error("No board to export");
  }

  const options = buildBoardRenderOptions({
    metaGame,
    settings,
    colourContext,
    globalMe,
    isParticipant,
  });

  const liveSvg = getLiveSvg(boardRenderIndex, rendered);
  const svg =
    liveSvg?.cloneNode(true) ??
    renderBoardSvg(rep, options, { layerIndex: 0, metaGame });
  if (!svg) {
    throw new Error("Board render failed");
  }

  const blob = await svgToPngBlob(svg, {
    background: colourContext?.background,
    liveSvg,
    metaGame,
  });
  triggerDownload(blob, boardPngFilename(metaGame, gameId));
}

export async function exportBoardGif({
  exploration,
  game,
  focus,
  getFocusNode,
  replaceNames,
  players,
  users,
  getPerspective,
  altDisplay,
  metaGame,
  gameId,
  settings,
  colourContext,
  globalMe,
  isParticipant,
  delaySec,
  startPathIndex,
  endPathIndex,
  onProgress,
}) {
  const path = getPathToFocus(exploration, game, focus);
  const frames = slicePathFrames(path, startPathIndex, endPathIndex);
  if (frames.length === 0) {
    throw new Error("No frames to export");
  }
  if (frames.length > MAX_GIF_FRAMES) {
    throw new Error(`FRAME_CAP:${MAX_GIF_FRAMES}`);
  }

  const options = buildBoardRenderOptions({
    metaGame,
    settings,
    colourContext,
    globalMe,
    isParticipant,
  });

  const rasterFrames = [];
  for (let i = 0; i < frames.length; i++) {
    onProgress?.(i + 1, frames.length);
    const rep = buildFrameRenderRep({
      exploration,
      game,
      focus: frames[i],
      getFocusNode,
      replaceNames,
      players,
      users,
      getPerspective,
      altDisplay,
    });
    const svg = renderBoardSvg(rep, options, { layerIndex: 0, metaGame });
    if (!svg) {
      throw new Error(`Failed to render frame ${i + 1}`);
    }
    const raster = await svgToImageData(svg, {
      background: colourContext?.background,
      metaGame,
    });
    rasterFrames.push(raster);
  }

  const blob = encodeAnimatedGif(rasterFrames, delaySec);
  triggerDownload(blob, boardGifFilename(metaGame, gameId));
}
