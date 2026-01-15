import { GameFactory } from "@abstractplay/gameslib";
import { callAuthApi } from "../api";
import { isInterestingComment } from "./misc";

// Whether the user wants to explore
export function isExplorer(explorer, me) {
  return (
    me?.settings?.all?.exploration === 1 ||
    (!me?.settings?.all?.exploration && explorer) // (exploration not set or set to "Always ask") and Explore clicked
  );
}

export function setURL(exploration, focus, game, navigate) {
  let newQueryString;
  if (game.gameOver) {
    if (focus.exPath.length === 0) {
      newQueryString = new URLSearchParams({
        move: focus.moveNumber,
      }).toString();
    } else {
      let node = getFocusNode(exploration, game, focus);
      newQueryString = new URLSearchParams({
        move: focus.moveNumber,
        nodeid: node.id,
      }).toString();
    }
    navigate(`?${newQueryString}`, { replace: true });
  }
}

export function setCanPublish(game, explorer, me, canPublishSetter) {
  if (
    me &&
    isExplorer(explorer, me) &&
    !game.simultaneous &&
    game.numPlayers === 2 &&
    game.gameOver &&
    game.players.find((p) => p.id === me.id) &&
    (!game.published || !game.published.includes(me.id))
  ) {
    canPublishSetter("yes");
  } else {
    canPublishSetter("no");
  }
}

function getExplorationNode(exploration, game, moveNumber) {
  let node = exploration[moveNumber];
  // rehydrate state if need
  if (node.state === null) {
    let tmpEngine = GameFactory(game.metaGame, game.state);
    if (moveNumber + 1 < tmpEngine.stack.length) {
      tmpEngine.gameover = false;
      tmpEngine.winner = [];
    }
    tmpEngine.stack = tmpEngine.stack.slice(0, moveNumber + 1);
    tmpEngine.load();
    node.state = tmpEngine.cheapSerialize();
  }
  return node;
}

export function mergeExploration(
  game,
  exploration,
  data,
  me,
  errorSetter,
  errorMessageRef
) {
  const moveNumber = exploration.length;
  if (data[0] && data[0].move === moveNumber) {
    let node = getExplorationNode(exploration, game, moveNumber - 1);
    let gameEngine = GameFactory(game.metaGame, node.state);
    mergeMoveRecursive(gameEngine, node, data[0].tree);
  }
}

export function mergePublicExploration(game, exploration, data) {
  for (const m of data) {
    const version = m.version;
    const move = m.move;
    const tree = m.tree;
    let node = getExplorationNode(exploration, game, move - 1);
    node.version = version;
    node.comment = m.tree.comment;
    let gameEngine = GameFactory(game.metaGame, node.state);
    mergeMoveRecursive(gameEngine, node, tree.children);
  }
}

// When publishing, merge private exploration into public exploration
export function mergePrivateExploration(
  game,
  exploration,
  data,
  me,
  errorSetter,
  errorMessageRef
) {
  let moveNumbersUpdated = new Set();
  for (const m of data) {
    const version = m.version;
    const move = m.move;
    const tree = m.tree;
    let node = getExplorationNode(exploration, game, move - 1);
    if (version) node.version = version;
    let gameEngine = GameFactory(game.metaGame, node.state);
    const added = mergeMoveRecursive2(
      gameEngine,
      exploration,
      move - 1,
      node,
      tree
    );
    added.forEach((e) => moveNumbersUpdated.add(e));
  }
  if (moveNumbersUpdated.size > 0)
    fixMoveOutcomes(exploration, Math.max.apply(this, [...moveNumbersUpdated]));
  moveNumbersUpdated.forEach((e) => {
    saveExploration(
      exploration,
      e + 1,
      game,
      me,
      true,
      errorSetter,
      errorMessageRef
    );
  });
}

// Update outcomes of moves in the game. These aren't in the children of the previous move node, so outcomes need special handling.
export function fixMoveOutcomes(exploration, moveNumber) {
  let child = exploration[moveNumber];
  for (let moveNum = moveNumber; moveNum > 0; moveNum--) {
    const parent = exploration[moveNum - 1];
    const mover = 1 - parent.toMove;
    // if player x moved, and the other player (1-x) has a winning reply (outcome = 1-x), then player x loses
    // if player x moved, and the other player (1-x) has only losing replies (outcome = x) (no winning moves, no unknown outcome moves) then player x wins
    let a_child_wins = false;
    let all_children_lose = true;
    if (child.outcome === 1 - mover) a_child_wins = true;
    if (child.outcome !== mover) all_children_lose = false;
    parent.children.forEach((c) => {
      if (c.outcome === 1 - mover) a_child_wins = true;
      if (c.outcome !== mover) all_children_lose = false;
    });
    if (a_child_wins) parent.outcome = 1 - mover;
    else if (all_children_lose) parent.outcome = mover;
    else parent.outcome = -1;
    child = parent;
  }
}

// after you submit a move, move the subtree of that explored move to the actual move.
export function mergeExistingExploration(
  moveNum,
  cur_exploration,
  exploration,
  game = undefined,
  useSameMove = false
) {
  moveNum++;
  let subtree = cur_exploration;
  while (true) {
    let move = exploration[moveNum].move.toLowerCase().replace(/\s+/g, "");
    if (useSameMove) {
      let node = getExplorationNode(exploration, game, moveNum);
      let gameEngine = GameFactory(game.metaGame, node.state);
      subtree = subtree.children.find((e) => gameEngine.sameMove(move, e.move));
    } else {
      subtree = subtree.children.find(
        (e) => e.move.toLowerCase().replace(/\s+/g, "") === move
      );
    }
    if (subtree !== undefined) {
      moveNum++;
      if (moveNum === exploration.length) {
        exploration[exploration.length - 1].children = subtree.children;
        break;
      }
    } else {
      break;
    }
  }
}

function mergeMoveRecursive(gameEngine, node, children, newids = true) {
  children.forEach((n) => {
    gameEngine.move(n.move, { trusted: true });
    const pos = node.AddChild(n.move, gameEngine);
    if (newids) node.children[pos].id = n.id;
    if (n.outcome !== undefined && n.children.length === 0) {
      // outcome was set at a leaf of the exploration being merged
      const newnode = node.children[pos];
      if (newnode.outcome === -1) {
        // If the newnode didn't get an outcome from existing exploration, set it now
        newnode.SetOutcome(n.outcome);
      } else if (
        newnode.outcome !== n.outcome &&
        newnode.children.length === 0
      ) {
        // if two leaf nodes disagree on outcome, set it to undecided
        node.children[pos].SetOutcome(-1);
      }
    }
    if (n.comment !== undefined)
      for (const comment of n.comment) node.children[pos].AddComment(comment);
    if (!node.children[pos].premove && n.premove === true)
      node.children[pos].premove = true;
    mergeMoveRecursive(gameEngine, node.children[pos], n.children, newids);
    gameEngine.stack.pop();
    gameEngine.load();
    gameEngine.gameover = false;
    gameEngine.winner = [];
  });
}

// This version will check if exploration followed the actual game. It also returns those move numbers that were actually updated.
function mergeMoveRecursive2(gameEngine, exploration, moveNum, node, children) {
  let movesUpdated = new Set();
  if (moveNum === exploration.length - 1) return movesUpdated;
  const actualNextMove = exploration[moveNum + 1].move;
  children.forEach((n) => {
    gameEngine.move(n.move, { trusted: true });
    if (gameEngine.sameMove(n.move, actualNextMove)) {
      const updated = mergeMoveRecursive2(
        gameEngine,
        exploration,
        moveNum + 1,
        exploration[moveNum + 1],
        n.children
      );
      updated.forEach((e) => movesUpdated.add(e));
    } else {
      const pos = node.AddChild(n.move, gameEngine);
      if (n.outcome !== undefined && n.children.length === 0) {
        // outcome was set at a leaf of the exploration being merged
        const newnode = node.children[pos];
        if (newnode.outcome === -1) {
          // If the newnode didn't get an outcome from existing exploration, set it now
          newnode.SetOutcome(n.outcome);
        } else if (
          newnode.outcome !== n.outcome &&
          newnode.children.length === 0
        ) {
          // if two leaf nodes disagree on outcome, set it to undecided
          node.children[pos].SetOutcome(-1);
        }
      }
      movesUpdated.add(moveNum);
      mergeMoveRecursive(gameEngine, node.children[pos], n.children, false);
    }
    gameEngine.stack.pop();
    gameEngine.load();
    gameEngine.gameover = false;
    gameEngine.winner = [];
  });
  return movesUpdated;
}

export async function saveExploration(
  exploration,
  moveNumber,
  game,
  me,
  explorer,
  errorSetter,
  errorMessageRef,
  focus = undefined,
  navigate = undefined,
  commentJustAdded = false
) {
  if (!me) return;
  if (!isExplorer(explorer, me) && !commentJustAdded) return;
  if (!game.gameOver) {
    if (moveNumber !== exploration.length)
      throw new Error("Can't save exploration at this move!");
  }
  let pars = {
    public: game.gameOver,
    game: game.id,
    metaGame: game.metaGame,
    move: moveNumber,
    // Note that for completed games you can comment on the parent node, so don't just save children
    tree: game.gameOver
      ? exploration[moveNumber - 1].Deflate(game.gameOver)
      : exploration[moveNumber - 1].Deflate(game.gameOver).children,
  };
  if (game.gameOver) {
    pars.version = exploration[moveNumber - 1].version
      ? exploration[moveNumber - 1].version
      : 0;

    if (game.numMoves !== undefined && game.numMoves > game.numPlayers) {
      // Check if we need to update the commented flag for completed games
      const currentFlag = game.commented || 0; // note this should only happen after we have fetched public exploration, so should have the correct value
      // from before this (the one we are saving) exploration was added
      const newFlag = analyzeExplorationForCommentedFlag(exploration);
      if (newFlag !== currentFlag && !(newFlag === 0 && currentFlag === 1)) {
        // currentFlag can be 1 for in-game comments
        pars.updateCommentedFlag = newFlag;
        pars.gameEnded = game.completedGameKey
          ? game.completedGameKey.substring(0, 13)
          : game.gameEnded; // Send the gameEnded timestamp for the exact key
        game.commented = newFlag; // Update local copy
      }
    }
    // Only update lastChat when a comment was just added
    if (commentJustAdded) {
      pars.updateLastChat = true;
      pars.players = game.players;
      pars.gameEnded = game.completedGameKey
        ? game.completedGameKey.substring(0, 13)
        : game.gameEnded; // Include gameEnded for fetching the game if needed
      console.log(
        `Triggering lastChat update for game ${game.id} (comment was just added)`
      );
    }
  }
  const res = await callAuthApi("save_exploration", pars);
  if (!res) return;
  if (res.status !== 200) {
    const result = await res.json();
    errorMessageRef.current = `save_exploration failed, status = ${res.status}, message: ${result.message}`;
    errorSetter(true);
  } else {
    const result = await res.json();
    if (result && result.body) {
      // We only get here when failing to save public exploration (because the move was updated by someone else)
      const data = JSON.parse(result.body);
      const version = data.version;
      const move = data.sk;
      const tree = JSON.parse(data.tree);
      let node = getExplorationNode(exploration, game, move - 1);
      node.version = version;
      if (tree.comment !== undefined)
        for (const comment of tree.comment) node.AddComment(comment);
      let gameEngine = GameFactory(game.metaGame, node.state);
      mergeMoveRecursive(gameEngine, node, tree.children);
      if (focus !== undefined) setURL(exploration, focus, game, navigate);
      // Try to save again
      saveExploration(
        exploration,
        move,
        game,
        me,
        explorer,
        errorSetter,
        errorMessageRef,
        focus,
        navigate
      );
    } else if (game.gameOver) {
      exploration[moveNumber - 1].version =
        (exploration[moveNumber - 1].version
          ? exploration[moveNumber - 1].version
          : 0) + 1;
    }
  }
}

export function getFocusNode(exp, game, foc) {
  let curNode = getExplorationNode(exp, game, foc.moveNumber);
  for (const p of foc.exPath) {
    curNode = curNode.children[p];
  }
  return curNode;
}

export function getAllNodeComments(exploration) {
  const allComments = [];

  function traverseNode(node, moveNumber, exPath = []) {
    if (node.comment && Array.isArray(node.comment)) {
      // Add each comment with its path information
      node.comment.forEach((c) => {
        allComments.push({
          ...c,
          path: { moveNumber, exPath: [...exPath] },
          inGame: false, // These are all post-game comments
        });
      });
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child, index) => {
        traverseNode(child, moveNumber, [...exPath, index]);
      });
    }
  }

  if (exploration && Array.isArray(exploration)) {
    exploration.forEach((node, index) => traverseNode(node, index, []));
  }

  return allComments;
}

export function analyzeExplorationForCommentedFlag(exploration) {
  let hasVariations = false;
  let hasAnnotations = false;
  let hasComments = false;

  function traverseNode(node, depth) {
    // Check for variations (any node with children)
    if (
      node.children &&
      Array.isArray(node.children) &&
      node.children.length > 0
    ) {
      hasVariations = true;
      node.children.forEach((child) => traverseNode(child, depth + 1));
    }
    // Check for post-game comments (annotations)
    if (
      node.comment &&
      Array.isArray(node.comment) &&
      node.comment.length > 0
    ) {
      if (depth > 0) {
        hasAnnotations = true;
      } else if (node.comment.some((c) => isInterestingComment(c.comment))) {
        hasComments = true;
      }
    }
  }

  if (exploration && Array.isArray(exploration)) {
    exploration.forEach((node) => traverseNode(node, 0));
  }

  // Return the appropriate flag value
  if (hasAnnotations) {
    return 3; // Has post-game comments (annotations)
  } else if (hasVariations) {
    return 2; // Has post-game variations
  } else if (hasComments) {
    return 1; // Has post-game comments
  } else {
    return 0; // No post-game content
  }
}

export function canExploreMove(game, exploration, focus) {
  return (
    (!game.gameOver && // game isn't over
      (game.canExplore || (game.canSubmit && focus.exPath.length === 0)) && // exploring (beyond move input) is supported or it is my move and we are just looking at the current position
      exploration !== null &&
      focus.moveNumber === exploration.length - 1 && // we aren't looking at history
      getFocusNode(exploration, game, focus).toMove !== "") || // game (at focus) isn't over
    (game.gameOver &&
      game.canExplore &&
      focus.moveNumber !== exploration.length - 1 && // game is over and exploring is supported
      getFocusNode(exploration, game, focus).toMove !== "") // game (at focus) isn't over
  );
}

