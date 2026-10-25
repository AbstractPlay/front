function focusPathFromNavCell(cell) {
  return cell?.path ?? cell;
}

/**
 * Shared disabled flags and click handlers for move-tree nav (play + Lab).
 */
export function buildMoveTreeNavHandlers({
  focus,
  path,
  exploration,
  handleGameMoveClick,
  curNumVariations,
  onPrevVar,
  onNextVar,
}) {
  const depth = focus.moveNumber + focus.exPath.length;
  const prevDisabled = depth <= 0;
  const nextDisabled = depth >= path.length;
  const currentDisabled = depth === exploration.length - 1;
  const prevVarDisabled = curNumVariations <= 1;
  const nextVarDisabled = curNumVariations <= 1;

  const onBegin = () => handleGameMoveClick({ moveNumber: 0, exPath: [] });

  const onPrev = () => {
    if (prevDisabled) return;
    handleGameMoveClick(
      depth === 1
        ? { moveNumber: 0, exPath: [] }
        : focusPathFromNavCell(path[depth - 2][0])
    );
  };

  const onNext = () => {
    if (nextDisabled) return;
    handleGameMoveClick(focusPathFromNavCell(path[depth][0]));
  };

  const onCurrent = () =>
    handleGameMoveClick({ moveNumber: exploration.length - 1, exPath: [] });

  const handlePrevVar = () => {
    if (prevVarDisabled) return;
    onPrevVar();
  };

  const handleNextVar = () => {
    if (nextVarDisabled) return;
    onNextVar();
  };

  const positionIndex = depth + 1;
  const positionTotal = exploration.length;

  return {
    prevDisabled,
    nextDisabled,
    currentDisabled,
    prevVarDisabled,
    nextVarDisabled,
    onBegin,
    onPrev,
    onNext,
    onCurrent,
    onPrevVar: handlePrevVar,
    onNextVar: handleNextVar,
    mobileStepper: {
      positionIndex,
      positionTotal,
      prevDisabled,
      nextDisabled,
      onPrev,
      onNext,
    },
  };
}
