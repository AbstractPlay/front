const MAX_BOARD_RENDER_CACHE_ENTRIES = 64;

export function buildBoardRenderCacheKey({
  focus,
  displaySettings,
  metaGame,
  boardKey,
  colorMode,
  canExplore,
}) {
  const exPath = focus?.exPath?.join(",") ?? "";
  const display = displaySettings?.display ?? "";
  const rotate = displaySettings?.rotate ?? 0;
  const annotate = displaySettings?.annotate ? 1 : 0;
  return [
    metaGame,
    focus?.moveNumber ?? 0,
    exPath,
    display,
    rotate,
    annotate,
    boardKey,
    colorMode,
    canExplore ? 1 : 0,
  ].join("|");
}

export function cloneRenderedFrames(frames) {
  return frames.map((svg) => svg.cloneNode(true));
}

export function createBoardRenderCache() {
  const entries = new Map();

  return {
    get(key) {
      const value = entries.get(key);
      if (value === undefined) {
        return undefined;
      }
      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    set(key, frames) {
      if (entries.has(key)) {
        entries.delete(key);
      }
      entries.set(key, frames);
      if (entries.size > MAX_BOARD_RENDER_CACHE_ENTRIES) {
        const oldestKey = entries.keys().next().value;
        entries.delete(oldestKey);
      }
    },
    clear() {
      entries.clear();
    },
  };
}
