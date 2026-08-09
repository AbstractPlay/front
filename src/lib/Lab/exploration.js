import { GameFactory } from "@abstractplay/gameslib";
import { GameNode } from "../../components/Lab/GameTree";

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

function parseReferenceStack(gameState) {
  if (!gameState) return null;
  try {
    const parsed =
      typeof gameState === "string" ? JSON.parse(gameState) : gameState;
    return parsed?.stack ?? null;
  } catch {
    return null;
  }
}

function syncEmulatedMoveFromReference(
  gameEngine,
  referenceStack,
  targetDepth,
  move
) {
  const ref = referenceStack?.[targetDepth];
  if (
    !ref ||
    typeof gameEngine.syncFromStackEntry !== "function" ||
    !gameEngine.sameMove(move, ref.lastmove ?? "")
  ) {
    return;
  }
  gameEngine.syncFromStackEntry(ref);
}

function inflateRecursive(
  gameEngine,
  node,
  children,
  referenceStack,
  stackDepth
) {
  if (!Array.isArray(children)) return;
  children.forEach((n) => {
    if (!n?.move) return;
    gameEngine.move(n.move, { trusted: true, emulation: true });
    const targetDepth = stackDepth + 1;
    syncEmulatedMoveFromReference(
      gameEngine,
      referenceStack,
      targetDepth,
      n.move
    );
    const pos = node.AddChild(n.move, gameEngine);
    applyNodeAnnotations(node.children[pos], n);
    if (n.outcome !== undefined && (!n.children || n.children.length === 0)) {
      node.children[pos].SetOutcome(n.outcome);
    }
    if (n.children && n.children.length > 0) {
      inflateRecursive(
        gameEngine,
        node.children[pos],
        n.children,
        referenceStack,
        targetDepth
      );
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
  const referenceStack = parseReferenceStack(gameState);
  inflateRecursive(
    tmpEngine,
    nodes[moveCount - 1],
    deflatedChildren,
    referenceStack,
    moveCount - 1
  );
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
  const referenceStack = parseReferenceStack(game.state);
  const limit = Math.min(nodes.length, branches.length);
  for (let i = 0; i < limit; i++) {
    if (!branches[i]) continue;
    const node = getExplorationNode(nodes, game, i);
    const tmpEngine = GameFactory(metaGame, node.state);
    inflateRecursive(tmpEngine, node, branches[i], referenceStack, i);
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

function outcomeFromEngineState(metaGame, state, simultaneous) {
  if (!state) return -1;
  const engine = GameFactory(metaGame, state);
  if (engine.gameover && engine.winner.length === 1 && !simultaneous) {
    return engine.winner[0] - 1;
  }
  return -1;
}

function recalcVariationOutcomes(node, game) {
  if (node.children.length === 0) {
    node.outcome = outcomeFromEngineState(
      game.metaGame,
      node.state,
      game.simultaneous
    );
    return;
  }
  node.outcome = -1;
  node.children.forEach((child) => recalcVariationOutcomes(child, game));
}

export function syncLabGameOver(game, state) {
  const engine = GameFactory(game.metaGame, state);
  game.gameOver = engine.gameover;
}

export function recalculateLabOutcomes(nodes, game, fromMoveNumber = 0) {
  if (!nodes?.length) {
    game.gameOver = false;
    return;
  }

  const start = Math.max(0, fromMoveNumber);
  for (let i = start; i < nodes.length; i++) {
    const hasSpineContinuation = i < nodes.length - 1;
    if (hasSpineContinuation) {
      nodes[i].outcome = -1;
      nodes[i].children.forEach((child) =>
        recalcVariationOutcomes(child, game)
      );
    } else {
      recalcVariationOutcomes(nodes[i], game);
    }
  }

  syncLabGameOver(game, nodes[nodes.length - 1].state);
  fixMoveOutcomes(nodes, nodes.length - 1);
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
  const tipMoveNumber = nodes.length - 1;
  return getExplorationNode(nodes, game, tipMoveNumber).state;
}

export function shouldReplayAlongMainLine(exploration, focus, gameEngine, move) {
  const nextMain = exploration[focus.moveNumber + 1];
  return (
    focus.exPath.length === 0 &&
    focus.moveNumber < exploration.length - 1 &&
    nextMain &&
    gameEngine.sameMove(move, nextMain.move)
  );
}

export function shouldExtendMainLine(exploration, focus) {
  return (
    focus.exPath.length === 0 &&
    focus.moveNumber === exploration.length - 1
  );
}

export function createSpineNode(move, gameEngine, game) {
  const toMove = gameEngine.gameover ? "" : gameEngine.currplayer - 1;
  const newNode = new GameNode(null, move, gameEngine.serialize(), toMove);
  if (
    gameEngine.gameover &&
    gameEngine.winner.length === 1 &&
    !game.simultaneous
  ) {
    newNode.outcome = gameEngine.winner[0] - 1;
  }
  return newNode;
}

function isDeflatedBranch(entry) {
  return entry && typeof entry.move === "string";
}

function normalizedMoveEqual(moveA, moveB) {
  return (
    (moveA ?? "").toLowerCase().replace(/\s+/g, "") ===
    (moveB ?? "").toLowerCase().replace(/\s+/g, "")
  );
}

function unwrapChainToSessionBranches(history, rootBranches) {
  const branches = new Array(history.length).fill(null);
  let siblings = rootBranches;

  for (let i = 1; i < history.length; i++) {
    const targetMove = history[i].move;
    let found = -1;
    for (let j = 0; j < siblings.length; j++) {
      if (normalizedMoveEqual(siblings[j].move, targetMove)) {
        found = j;
        break;
      }
    }
    if (found === -1) return null;

    const matched = siblings[found];
    applyNodeAnnotations(history[i], matched);

    const side = siblings.filter((_, j) => j !== found);
    if (side.length > 0) {
      branches[i - 1] = side;
    }

    siblings = matched.children ?? [];
  }

  if (siblings.length > 0) {
    branches[history.length - 1] = siblings;
  }

  return branches;
}

export function normalizeSessionExploration(history, savedExploration) {
  if (!savedExploration || !history?.length) return savedExploration;
  if (
    savedExploration.length === history.length &&
    isSessionExplorationBranches(savedExploration)
  ) {
    return savedExploration;
  }

  if (
    Array.isArray(savedExploration) &&
    savedExploration.length > 0 &&
    isDeflatedBranch(savedExploration[0])
  ) {
    return savedExploration;
  }

  if (
    !isSessionExplorationBranches(savedExploration) ||
    savedExploration.length !== 1
  ) {
    return savedExploration;
  }

  const rootBranches = savedExploration[0];
  if (!Array.isArray(rootBranches) || rootBranches.length === 0) {
    return savedExploration;
  }

  const padded = unwrapChainToSessionBranches(history, rootBranches);
  if (!padded) return savedExploration;
  return padded;
}

export function deleteSpineEntry(exploration, moveNumber, promoteIndex = 0) {
  if (moveNumber <= 0 || moveNumber >= exploration.length) {
    return { focus: { moveNumber: 0, exPath: [] } };
  }

  const forwardBranches = [...exploration[moveNumber].children];
  exploration.length = moveNumber;

  if (forwardBranches.length > 0) {
    const idx = Math.min(
      Math.max(0, promoteIndex),
      forwardBranches.length - 1
    );
    const promoted = forwardBranches[idx];
    const siblings = forwardBranches.filter((_, i) => i !== idx);
    promoted.parent = null;
    promoted.children = [...promoted.children, ...siblings];
    exploration.push(promoted);
    return { focus: { moveNumber, exPath: [] } };
  }

  return { focus: { moveNumber: moveNumber - 1, exPath: [] } };
}

export function canExploreMove(game, exploration, focus) {
  const node = getFocusNode(exploration, game, focus);
  if (!node || exploration === null || !game.canExplore) return false;
  // Lab sandbox: explore from any non-terminal position, including backtracked
  // main-line moves on in-progress imported games (unlike live games).
  return node.toMove !== "";
}
