/** Element ids where move-tree keyboard shortcuts must not fire. */
export const MOVE_TREE_KEYBOARD_INPUT_IDS = new Set([
  "enterAMove",
  "card-enterAMove",
  "enterAComment",
  "enterANote",
  "myCustomCSS",
  "playgroundMoveComment",
  "labSaveName",
  "labSaveNameUpdate",
]);

export function shouldSkipMoveTreeKeyboard(activeElement, exploration) {
  if (exploration === null) {
    return true;
  }
  if (activeElement && MOVE_TREE_KEYBOARD_INPUT_IDS.has(activeElement.id)) {
    return true;
  }
  return false;
}

export function getPath(focus, exploration, path, gameOver) {
  let curNumVariations = 0;
  if (!gameOver) {
    for (let i = 1; i < exploration.length; i++) {
      path.push([{ moveNumber: i, exPath: [] }]);
    }
    if (focus.moveNumber === exploration.length - 1) {
      let node = exploration[focus.moveNumber];
      for (let j = 0; j < focus.exPath.length; j++) {
        curNumVariations = node.children.length;
        node = node.children[focus.exPath[j]];
        path.push([
          {
            moveNumber: focus.moveNumber,
            exPath: focus.exPath.slice(0, j + 1),
          },
        ]);
      }
      while (node.children.length > 0) {
        let next = [];
        for (let k = 0; k < node.children.length; k++) {
          next.push({
            moveNumber: focus.moveNumber,
            exPath: focus.exPath.concat(k),
          });
        }
        path.push(next);
        if (node.children.length !== 1) break;
        node = node.children[0];
      }
    }
  } else {
    for (
      let i = 1;
      i <=
      (exploration[focus.moveNumber].children.length > 0
        ? focus.moveNumber
        : exploration.length - 1);
      i++
    ) {
      if (i === focus.moveNumber) {
        if (focus.exPath.length === 0) {
          curNumVariations =
            1 +
            (focus.moveNumber === 0
              ? 0
              : exploration[focus.moveNumber - 1].children.length);
        }
      }
      path.push([{ moveNumber: i, exPath: [] }]);
    }
    let node = exploration[focus.moveNumber];
    for (let j = 0; j < focus.exPath.length; j++) {
      if (j === focus.exPath.length - 1) {
        curNumVariations = node.children.length;
        if (j === 0) curNumVariations += 1;
      }
      node = node.children[focus.exPath[j]];
      path.push([
        {
          moveNumber: focus.moveNumber,
          exPath: focus.exPath.slice(0, j + 1),
        },
      ]);
    }
    let exPath = [...focus.exPath];
    while (node.children.length > 0) {
      let next = [];
      if (
        focus.moveNumber < exploration.length - 1 &&
        focus.exPath.length === 0
      ) {
        next.push({
          moveNumber: focus.moveNumber + 1,
          exPath: [],
        });
      }
      for (let k = 0; k < node.children.length; k++) {
        next.push({
          moveNumber: focus.moveNumber,
          exPath: exPath.concat(k),
        });
      }
      exPath = exPath.concat(0);
      path.push(next);
      if (next.length !== 1) break;
      node = node.children[0];
    }
  }
  return curNumVariations;
}

export function nextVarFocus(focus, game, curNumVariations) {
  if (!game.gameOver || focus.exPath.length > 1) {
    return {
      moveNumber: focus.moveNumber,
      exPath: [
        ...focus.exPath.slice(0, -1),
        (focus.exPath[focus.exPath.length - 1] + 1) % curNumVariations,
      ],
    };
  }
  if (focus.exPath.length === 0) {
    return {
      moveNumber: focus.moveNumber - 1,
      exPath: [0],
    };
  }
  if (focus.exPath[0] === curNumVariations - 2) {
    return {
      moveNumber: focus.moveNumber + 1,
      exPath: [],
    };
  }
  return {
    moveNumber: focus.moveNumber,
    exPath: [focus.exPath[0] + 1],
  };
}

export function prevVarFocus(focus, game, curNumVariations) {
  if (!game.gameOver || focus.exPath.length > 1) {
    return {
      moveNumber: focus.moveNumber,
      exPath: [
        ...focus.exPath.slice(0, -1),
        (focus.exPath[focus.exPath.length - 1] + curNumVariations - 1) %
          curNumVariations,
      ],
    };
  }
  if (focus.exPath.length === 0) {
    return {
      moveNumber: focus.moveNumber - 1,
      exPath: [curNumVariations - 2],
    };
  }
  if (focus.exPath[0] === 0) {
    return {
      moveNumber: focus.moveNumber + 1,
      exPath: [],
    };
  }
  return {
    moveNumber: focus.moveNumber,
    exPath: [focus.exPath[0] - 1],
  };
}

export function handleMoveTreeKeyDown(
  event,
  { focus, exploration, game, handleGameMoveClick }
) {
  if (
    shouldSkipMoveTreeKeyboard(document.activeElement, exploration) ||
    focus === null ||
    game === null
  ) {
    return;
  }

  const key = event.key;
  const path = [];
  let curNumVariations;

  switch (key) {
    case "Home":
    case "h":
      handleGameMoveClick({ moveNumber: 0, exPath: [] });
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "j":
      getPath(focus, exploration, path, game.gameOver);
      if (focus.moveNumber + focus.exPath.length > 0) {
        handleGameMoveClick(
          focus.moveNumber + focus.exPath.length === 1
            ? { moveNumber: 0, exPath: [] }
            : path[focus.moveNumber + focus.exPath.length - 2][0]
        );
      }
      event.preventDefault();
      break;
    case "ArrowRight":
    case "k":
      getPath(focus, exploration, path, game.gameOver);
      if (focus.moveNumber + focus.exPath.length < path.length) {
        handleGameMoveClick(path[focus.moveNumber + focus.exPath.length][0]);
      }
      event.preventDefault();
      break;
    case "End":
    case "l":
      getPath(focus, exploration, path, game.gameOver);
      if (focus.moveNumber + focus.exPath.length !== exploration.length - 1) {
        handleGameMoveClick(
          exploration.length === 1
            ? { moveNumber: 0, exPath: [] }
            : path[exploration.length - 2][0]
        );
      }
      event.preventDefault();
      break;
    case "ArrowDown":
    case "i":
      curNumVariations = getPath(focus, exploration, path, game.gameOver);
      if (curNumVariations > 1) {
        handleGameMoveClick(nextVarFocus(focus, game, curNumVariations));
      }
      event.preventDefault();
      break;
    case "ArrowUp":
    case "m":
      curNumVariations = getPath(focus, exploration, path, game.gameOver);
      if (curNumVariations > 1) {
        handleGameMoveClick(prevVarFocus(focus, game, curNumVariations));
      }
      event.preventDefault();
      break;
    default:
  }
}
