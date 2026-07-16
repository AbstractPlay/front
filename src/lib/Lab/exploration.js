import { GameFactory } from "@abstractplay/gameslib";

export function serializeExploration(nodes, gameOver = false) {
  if (!nodes || nodes.length === 0) return null;
  const tip = nodes[nodes.length - 1];
  if (!tip || tip.children.length === 0) return null;
  return tip.Deflate(gameOver).children;
}

function applyNodeAnnotations(target, source) {
  if (source.nag) target.SetNag(source.nag);
  if (source.textComment) target.SetTextComment(source.textComment);
}

function inflateRecursive(gameEngine, node, children) {
  if (!Array.isArray(children)) return;
  children.forEach((n) => {
    if (!n?.move) return;
    gameEngine.move(n.move, { trusted: true });
    const pos = node.AddChild(n.move, gameEngine);
    applyNodeAnnotations(node.children[pos], n);
    if (n.outcome !== undefined && (!n.children || n.children.length === 0)) {
      node.children[pos].SetOutcome(n.outcome);
    }
    if (n.children && n.children.length > 0) {
      inflateRecursive(gameEngine, node.children[pos], n.children);
    }
    gameEngine.stack.pop();
    gameEngine.load();
    gameEngine.gameover = false;
    gameEngine.winner = [];
  });
}

export function restoreExplorationTree(
  nodes,
  metaGame,
  gameState,
  deflatedChildren
) {
  if (!deflatedChildren || deflatedChildren.length === 0) return;
  const tmpEngine = GameFactory(metaGame, gameState);
  const moveCount = nodes.length;
  if (tmpEngine.stack.length >= moveCount) {
    tmpEngine.stack = tmpEngine.stack.slice(0, moveCount);
    tmpEngine.load();
  }
  nodes[moveCount - 1].state = tmpEngine.cheapSerialize();
  inflateRecursive(tmpEngine, nodes[moveCount - 1], deflatedChildren);
}

let sessionPersistCallback = null;

export function setLabSessionPersistCallback(cb) {
  sessionPersistCallback = cb;
}

export function saveLabExploration() {
  if (sessionPersistCallback) {
    sessionPersistCallback();
  }
}

export function serializeSessionExploration(nodes, gameOver = false) {
  if (!nodes?.length) return null;
  const branches = nodes.map((node) =>
    node.children.length > 0 ? node.Deflate(gameOver).children : null
  );
  return branches.some(Boolean) ? branches : null;
}

export function isSessionExplorationBranches(exploration) {
  if (!Array.isArray(exploration) || exploration.length === 0) return false;
  return exploration.every(
    (entry) =>
      entry === null ||
      (Array.isArray(entry) &&
        entry.every((branch) => typeof branch?.move === "string"))
  );
}

export function restoreSessionExploration(nodes, metaGame, game, branches) {
  if (!branches || !Array.isArray(branches)) return;
  const limit = Math.min(nodes.length, branches.length);
  for (let i = 0; i < limit; i++) {
    if (!branches[i]) continue;
    const node = getExplorationNode(nodes, game, i);
    const tmpEngine = GameFactory(metaGame, node.state);
    inflateRecursive(tmpEngine, node, branches[i]);
  }
}

function getExplorationNode(exploration, game, moveNumber) {
  let node = exploration[moveNumber];
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

export function sanitizeFocus(nodes, focus) {
  if (!nodes?.length) {
    return { moveNumber: 0, exPath: [] };
  }
  let moveNumber =
    typeof focus?.moveNumber === "number" ? focus.moveNumber : nodes.length - 1;
  if (moveNumber < 0 || moveNumber >= nodes.length) {
    moveNumber = nodes.length - 1;
  }
  const exPath = [];
  let curNode = nodes[moveNumber];
  const path = Array.isArray(focus?.exPath) ? focus.exPath : [];
  for (const p of path) {
    if (!curNode?.children?.[p]) break;
    exPath.push(p);
    curNode = curNode.children[p];
  }
  return { moveNumber, exPath };
}

export function getFocusNode(exp, game, foc) {
  if (!exp?.length || !foc) return undefined;
  if (foc.moveNumber < 0 || foc.moveNumber >= exp.length) return undefined;
  let curNode = getExplorationNode(exp, game, foc.moveNumber);
  if (!curNode) return undefined;
  for (const p of foc.exPath) {
    if (!curNode?.children?.[p]) return undefined;
    curNode = curNode.children[p];
  }
  return curNode;
}

export function fixMoveOutcomes(exploration, moveNumber) {
  let child = exploration[moveNumber];
  for (let moveNum = moveNumber; moveNum > 0; moveNum--) {
    const parent = exploration[moveNum - 1];
    const mover = 1 - parent.toMove;
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

function serializeNodeAnnotation(node) {
  if (!node) return null;
  const entry = {};
  if (node.nag) entry.nag = node.nag;
  if (node.textComment) entry.textComment = node.textComment;
  return Object.keys(entry).length > 0 ? entry : null;
}

export function serializeMainLineAnnotations(nodes) {
  if (!nodes?.length) return null;
  const annotations = nodes.map((node) => serializeNodeAnnotation(node));
  return annotations.some(Boolean) ? annotations : null;
}

export function restoreMainLineAnnotations(nodes, annotations) {
  if (!nodes?.length || !Array.isArray(annotations)) return;
  const limit = Math.min(nodes.length, annotations.length);
  for (let i = 0; i < limit; i++) {
    const entry = annotations[i];
    if (!entry) continue;
    applyNodeAnnotations(nodes[i], entry);
  }
}

export function getMainLineTipState(nodes, game) {
  if (!nodes?.length) return game?.state;
  return getExplorationNode(nodes, game, nodes.length - 1).state;
}

export function canExploreMove(game, exploration, focus) {
  const node = getFocusNode(exploration, game, focus);
  if (!node || exploration === null || !game.canExplore) return false;
  // Lab sandbox: explore from any non-terminal position, including backtracked
  // main-line moves on in-progress imported games (unlike live games).
  return node.toMove !== "";
}
