/**
 * Whether an in-flight board SVG build should update React state.
 * Guards against stale commits when renderrep or focus changes retrigger the effect.
 */
export function shouldCommitBoardRender({
  generationAtStart,
  generationNow,
  renderrepAtStart,
  renderrepLatest,
}) {
  if (generationAtStart !== generationNow) {
    return false;
  }
  if (renderrepLatest !== renderrepAtStart) {
    return false;
  }
  return true;
}
