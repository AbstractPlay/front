/**
 * Variation (branch) switching at the current focus — live move tree.
 */

/**
 * @param {{ moveNumber: number; exPath?: number[] }} a
 * @param {{ moveNumber: number; exPath?: number[] }} b
 * @returns {boolean}
 */
export function explorationPathEquals(a, b) {
  if (!a || !b) {
    return false;
  }
  if (a.moveNumber !== b.moveNumber) {
    return false;
  }
  const ap = a.exPath ?? [];
  const bp = b.exPath ?? [];
  if (ap.length !== bp.length) {
    return false;
  }
  return ap.every((v, i) => v === bp[i]);
}

/**
 * Path index in the move table for the ply that matches the current focus.
 * @param {{ moveNumber: number; exPath?: number[] } | null | undefined} focus
 * @returns {number}
 */
export function focusedMovePathIndex(focus) {
  if (!focus || focus.moveNumber < 1) {
    return -1;
  }
  const exLen = focus.exPath?.length ?? 0;
  if (exLen > 0) {
    return focus.moveNumber + exLen - 1;
  }
  return focus.moveNumber - 1;
}

/**
 * @param {unknown[]} exploration
 * @param {{ moveNumber: number; exPath?: number[] }} choice
 * @returns {unknown | null}
 */
export function nodeForExplorationPath(exploration, choice) {
  if (!exploration?.length || !choice) {
    return null;
  }
  const exPath = choice.exPath ?? [];
  if (exPath.length === 0) {
    return exploration[choice.moveNumber] ?? null;
  }
  let node = exploration[choice.moveNumber];
  if (!node) {
    return null;
  }
  for (const idx of exPath) {
    node = node?.children?.[idx];
    if (!node) {
      return null;
    }
  }
  return node;
}

/**
 * Paths the user can cycle with ↑/↓ at the current focus.
 * @param {{ moveNumber: number; exPath?: number[] }} focus
 * @param {unknown[]} exploration
 * @param {{ gameOver?: boolean }} game
 * @returns {{ count: number; choices: Array<{ moveNumber: number; exPath: number[] }> }}
 */
export function collectVariationChoices(focus, exploration, game) {
  const empty = { count: 0, choices: [] };
  if (!exploration?.length || !focus) {
    return empty;
  }

  const gameOver = Boolean(game?.gameOver);

  if (!gameOver) {
    if (focus.moveNumber !== exploration.length - 1) {
      return empty;
    }
    if (focus.exPath.length === 0) {
      const node = exploration[focus.moveNumber];
      const childCount = node?.children?.length ?? 0;
      if (childCount <= 1) {
        return empty;
      }
      const choices = [];
      for (let k = 0; k < childCount; k++) {
        choices.push({ moveNumber: focus.moveNumber, exPath: [k] });
      }
      return { count: choices.length, choices };
    }
    let node = exploration[focus.moveNumber];
    for (let j = 0; j < focus.exPath.length - 1; j++) {
      node = node?.children?.[focus.exPath[j]];
    }
    const childCount = node?.children?.length ?? 0;
    if (childCount <= 1) {
      return empty;
    }
    const prefix = focus.exPath.slice(0, -1);
    const choices = [];
    for (let k = 0; k < childCount; k++) {
      choices.push({ moveNumber: focus.moveNumber, exPath: prefix.concat(k) });
    }
    return { count: childCount, choices };
  }

  if (focus.exPath.length === 0) {
    const prevChildren =
      focus.moveNumber === 0
        ? []
        : exploration[focus.moveNumber - 1]?.children ?? [];
    const count = 1 + prevChildren.length;
    if (count <= 1) {
      return empty;
    }
    const choices = [{ moveNumber: focus.moveNumber, exPath: [] }];
    for (let k = 0; k < prevChildren.length; k++) {
      choices.push({ moveNumber: focus.moveNumber - 1, exPath: [k] });
    }
    return { count, choices };
  }

  let node = exploration[focus.moveNumber];
  for (let j = 0; j < focus.exPath.length - 1; j++) {
    node = node?.children?.[focus.exPath[j]];
  }
  const childCount = node?.children?.length ?? 0;
  const atFirstBranch = focus.exPath.length === 1;
  const count = atFirstBranch ? childCount + 1 : childCount;
  if (count <= 1) {
    return empty;
  }

  const choices = [];
  if (atFirstBranch) {
    if (focus.moveNumber < exploration.length - 1) {
      choices.push({ moveNumber: focus.moveNumber + 1, exPath: [] });
    }
    for (let k = 0; k < childCount; k++) {
      choices.push({ moveNumber: focus.moveNumber, exPath: [k] });
    }
  } else {
    const prefix = focus.exPath.slice(0, -1);
    for (let k = 0; k < childCount; k++) {
      choices.push({ moveNumber: focus.moveNumber, exPath: prefix.concat(k) });
    }
  }
  return { count: choices.length, choices };
}

/**
 * @param {unknown[]} exploration
 * @param {Array<{ moveNumber: number; exPath: number[] }>} choices
 * @param {{ moveNumber: number; exPath?: number[] }} focus
 * @param {(args: { movePath: { moveNumber: number; exPath: number[] }; isFocus: boolean }) => string} buildClass
 * @returns {Array<{ class: string; outcome: number; move: string; path: { moveNumber: number; exPath: number[] } }>}
 */
export function moveCellsFromVariationChoices(
  exploration,
  choices,
  focus,
  buildClass
) {
  const cells = [];
  for (const choice of choices) {
    const node = nodeForExplorationPath(exploration, choice);
    if (!node) {
      continue;
    }
    const isFocus = explorationPathEquals(choice, focus);
    cells.push({
      class: buildClass({ movePath: choice, isFocus }),
      outcome: node.outcome ?? -1,
      move: node.move ?? "",
      path: choice,
    });
  }
  return cells;
}

/**
 * @param {Array<{ path?: { moveNumber: number; exPath?: number[] }; class?: string }>} row
 * @param {{ moveNumber: number; exPath?: number[] }} focus
 * @returns {boolean}
 */
export function rowHasFocus(row, focus) {
  if (!Array.isArray(row)) {
    return false;
  }
  return row.some((cell) => explorationPathEquals(cell.path, focus));
}
