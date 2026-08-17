import { sanitizeFocus } from "../Lab/exploration";

function focusKey(focus) {
  return `${focus.moveNumber}:${focus.exPath.join(",")}`;
}

/**
 * Frames from initial position along main line to focus.moveNumber, then variation steps.
 */
export function getPathToFocus(exploration, game, focus) {
  if (!exploration?.length || !focus) return [];

  const safe = sanitizeFocus(exploration, focus);
  const frames = [];

  for (let moveNumber = 0; moveNumber <= safe.moveNumber; moveNumber++) {
    frames.push({ moveNumber, exPath: [] });
  }

  let exPath = [];
  for (const step of safe.exPath) {
    exPath = [...exPath, step];
    frames.push({ moveNumber: safe.moveNumber, exPath: [...exPath] });
  }

  return frames;
}

export function slicePathFrames(frames, startPathIndex, endPathIndex) {
  if (!frames?.length) return [];
  const start = Math.max(0, Math.min(startPathIndex ?? 0, frames.length - 1));
  const end = Math.max(
    start,
    Math.min(endPathIndex ?? frames.length - 1, frames.length - 1)
  );
  return frames.slice(start, end + 1);
}

export function labelPathFrame(frame, exploration, getFocusNode, game, t) {
  if (frame.moveNumber === 0 && frame.exPath.length === 0) {
    return t("boardExport.pathInitial");
  }

  if (frame.exPath.length > 0) {
    const node = getFocusNode(exploration, game, frame);
    const move = node?.move;
    if (move) {
      return t("boardExport.pathVariation", { move });
    }
    return t("boardExport.pathVariationUnknown");
  }

  if (frame.moveNumber > 0) {
    const node = exploration[frame.moveNumber];
    const move = node?.move;
    if (move) {
      return t("boardExport.pathMove", { number: frame.moveNumber, move });
    }
  }

  return t("boardExport.pathStep", { number: frame.moveNumber });
}

export function buildPathFrameOptions(frames, exploration, getFocusNode, game, t) {
  const seen = new Set();
  return frames.map((frame, index) => {
    const key = focusKey(frame);
    let uniqueKey = key;
    if (seen.has(key)) {
      uniqueKey = `${key}@${index}`;
    }
    seen.add(key);
    return {
      index,
      focus: frame,
      label: labelPathFrame(frame, exploration, getFocusNode, game, t),
      key: uniqueKey,
    };
  });
}

export const MAX_GIF_FRAMES = 200;
