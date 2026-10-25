import { getPath } from "./moveTreeKeyboard";
import { buildMoveTreeNavHandlers } from "./moveTreeNavHandlers";

function focusPathFromNavCell(cell) {
  return cell?.path ?? cell;
}

/**
 * Prev/next thumb bar props for live play (uses same path as keyboard nav).
 */
export function buildMoveTreeMobileStepperProps({
  focus,
  exploration,
  game,
  handleGameMoveClick,
}) {
  if (!focus || !exploration || !game) {
    return null;
  }
  const path = [];
  getPath(focus, exploration, path, game.gameOver);
  const navPath = path.map((row) =>
    row.map((cell) => ({ path: focusPathFromNavCell(cell) }))
  );
  const { mobileStepper } = buildMoveTreeNavHandlers({
    focus,
    path: navPath,
    exploration,
    handleGameMoveClick,
    curNumVariations: 1,
    onPrevVar: () => {},
    onNextVar: () => {},
  });
  return mobileStepper;
}
