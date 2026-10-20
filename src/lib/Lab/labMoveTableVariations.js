import {
  collectVariationChoices,
  focusedMovePathIndex,
  shouldSubstituteVariationChoicesAtCell,
} from "../GameMove/moveTreeVariations";

/**
 * Playground-only: mainline next ply vs exploration children from focus (rewound line).
 */
export function collectNextPlyBranchChoices(focus, exploration) {
  const empty = { count: 0, choices: [] };
  if (!exploration?.length || !focus) {
    return empty;
  }
  const exPath = focus.exPath ?? [];
  if (exPath.length !== 0) {
    return empty;
  }
  const childCount = exploration[focus.moveNumber]?.children?.length ?? 0;
  if (childCount === 0 || focus.moveNumber >= exploration.length - 1) {
    return empty;
  }
  const choices = [{ moveNumber: focus.moveNumber + 1, exPath: [] }];
  for (let k = 0; k < childCount; k++) {
    choices.push({ moveNumber: focus.moveNumber, exPath: [k] });
  }
  return { count: choices.length, choices };
}

export function labVariationChoicesForMoveCell(
  movenum,
  focus,
  exploration,
  game
) {
  const focusedIdx = focusedMovePathIndex(focus);
  if (
    movenum === focusedIdx + 1 &&
    (focus.exPath?.length ?? 0) === 0 &&
    (exploration[focus.moveNumber]?.children?.length ?? 0) > 0 &&
    focus.moveNumber < exploration.length - 1
  ) {
    return collectNextPlyBranchChoices(focus, exploration);
  }
  return collectVariationChoices(focus, exploration, game);
}

/**
 * Playground-only: also substitute on the path row *after* focus when showing next-ply branches.
 */
export function labShouldSubstituteVariationChoicesAtCell(
  focus,
  exploration,
  movenum,
  focusedBranchPathIndex,
  branchChoiceCount,
  cells
) {
  const focusedIdx = focusedBranchPathIndex;
  const atNextPlyRow =
    movenum === focusedIdx + 1 &&
    (focus.exPath?.length ?? 0) === 0 &&
    (exploration[focus.moveNumber]?.children?.length ?? 0) > 0 &&
    focus.moveNumber < (exploration?.length ?? 0) - 1;

  if (movenum === focusedIdx) {
    return shouldSubstituteVariationChoicesAtCell(
      focus,
      exploration,
      movenum,
      focusedBranchPathIndex,
      branchChoiceCount,
      cells
    );
  }

  if (!atNextPlyRow) {
    return false;
  }
  if (branchChoiceCount <= 1) {
    return false;
  }
  if (!Array.isArray(cells) || cells.length !== 1) {
    return false;
  }
  if (!focus || !exploration?.length) {
    return false;
  }
  const onMainlineTip =
    focus.moveNumber === exploration.length - 1 &&
    (focus.exPath?.length ?? 0) === 0;
  if (onMainlineTip) {
    return false;
  }
  return true;
}
