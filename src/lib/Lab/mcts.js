import { GameFactory } from "@abstractplay/gameslib";
import { getFocusNode } from "./exploration";

const EXPLORATION = Math.SQRT2;
const YIELD_INTERVAL_MS = 50;
const MAX_PLAYOUT_PLIES = 120;

/** Maximum think time exposed in the Playground UI (seconds). */
export const MCTS_MAX_SECONDS = 300;

/** Extend to 3+ players with selfish rollouts when multi-player MCTS is added. */
export function isMctsSupported(game) {
  return !game.noMoves && game.numPlayers === 2;
}

export function getMctsRootState({ exploration, focus, game, engine }) {
  const node = getFocusNode(exploration, game, focus);
  return node?.state ?? engine?.serialize?.() ?? game.state;
}

function snapshotState(engine) {
  return engine.serialize();
}

function shouldBlockAutomove(engine, gameFlags) {
  return (
    gameFlags.pieEven &&
    ((typeof engine.shouldOfferPie === "function" && engine.shouldOfferPie()) ||
      (typeof engine.shouldOfferPie !== "function" &&
        engine.state().stack.length === 2))
  );
}

function getLegalMoves(engine, gameFlags) {
  if (gameFlags.noMoves) return [];
  return engine.moves();
}

function uniqueMoves(moves) {
  const seen = new Set();
  const result = [];
  for (const move of moves) {
    if (move == null || move === "") continue;
    if (seen.has(move)) continue;
    seen.add(move);
    result.push(move);
  }
  return result;
}

/** Auto-play forced moves, matching Lab doView behaviour. */
export function applyAutomoves(engine, gameFlags) {
  let moves = getLegalMoves(engine, gameFlags);
  while (
    moves.length === 1 &&
    (gameFlags.automove || moves[0] === "pass") &&
    !shouldBlockAutomove(engine, gameFlags) &&
    !engine.__noAutomove
  ) {
    engine.move(moves[0], { trusted: true });
    if (engine.gameover) break;
    moves = getLegalMoves(engine, gameFlags);
  }
  return moves;
}

function createEngine(metaGame, state, gameFlags) {
  const engine = GameFactory(metaGame, state);
  applyAutomoves(engine, gameFlags);
  return engine;
}

function evaluateTerminal(engine, rootPlayer) {
  if (!engine.gameover) return 0;
  const winners = engine.winner;
  if (!winners || winners.length === 0) return 0;
  if (winners.length > 1) return 0;
  const winner = winners[0] - 1;
  if (winner === rootPlayer) return 1;
  return -1;
}

function continuePlayout(engine, gameFlags, rootPlayer, maxPlies) {
  let plies = 0;
  while (!engine.gameover && plies < maxPlies) {
    const moves = getLegalMoves(engine, gameFlags);
    if (!moves || moves.length === 0) break;
    const move = moves[Math.floor(Math.random() * moves.length)];
    engine.move(move, { trusted: true });
    applyAutomoves(engine, gameFlags);
    plies += 1;
  }
  return evaluateTerminal(engine, rootPlayer);
}

function randomPlayout(metaGame, state, gameFlags, rootPlayer) {
  const engine = createEngine(metaGame, state, gameFlags);
  return continuePlayout(engine, gameFlags, rootPlayer, MAX_PLAYOUT_PLIES);
}

class MctsNode {
  constructor({ state, move, parent, playerToMove, terminal = false }) {
    this.state = state;
    this.move = move;
    this.parent = parent;
    this.playerToMove = playerToMove;
    this.children = [];
    this.visits = 0;
    this.wins = 0;
    this.untriedMoves = null;
    this.terminal = terminal;
  }
}

function findChildByMove(node, move) {
  return node.children.find((child) => child.move === move);
}

function loadUntriedMoves(node, metaGame, gameFlags) {
  if (node.untriedMoves !== null) return node.untriedMoves;
  const engine = createEngine(metaGame, node.state, gameFlags);
  if (engine.gameover) {
    node.terminal = true;
    node.untriedMoves = [];
    return node.untriedMoves;
  }
  const legal = uniqueMoves(getLegalMoves(engine, gameFlags));
  node.untriedMoves = legal.filter((move) => !findChildByMove(node, move));
  if (node.untriedMoves.length === 0 && legal.length === 0) {
    node.terminal = true;
  }
  return node.untriedMoves;
}

function expand(node, metaGame, gameFlags) {
  const untried = loadUntriedMoves(node, metaGame, gameFlags);
  if (untried.length === 0) return { node, engine: null };
  const moveIndex = Math.floor(Math.random() * untried.length);
  const move = untried.splice(moveIndex, 1)[0];
  const engine = createEngine(metaGame, node.state, gameFlags);
  engine.move(move, { trusted: true });
  applyAutomoves(engine, gameFlags);
  const childPlayer = engine.gameover ? null : engine.currplayer - 1;
  const child = new MctsNode({
    state: snapshotState(engine),
    move,
    parent: node,
    playerToMove: childPlayer,
    terminal: engine.gameover,
  });
  node.children.push(child);
  return { node: child, engine };
}

function uctScore(child, parentVisits, maximizing) {
  if (child.visits === 0) return Infinity;
  const exploit = child.wins / child.visits;
  const explore = EXPLORATION * Math.sqrt(Math.log(parentVisits) / child.visits);
  return (maximizing ? exploit : -exploit) + explore;
}

function selectChild(node, rootPlayer) {
  const maximizing = node.playerToMove === rootPlayer;
  let best = null;
  let bestScore = -Infinity;
  for (const child of node.children) {
    const score = uctScore(child, node.visits, maximizing);
    if (score > bestScore) {
      bestScore = score;
      best = child;
    }
  }
  return best;
}

function backpropagate(node, result) {
  let value = result;
  let current = node;
  while (current) {
    current.visits += 1;
    current.wins += value;
    value = -value;
    current = current.parent;
  }
}

function runIteration(root, metaGame, gameFlags, rootPlayer) {
  let node = root;
  let playoutEngine = null;

  while (true) {
    loadUntriedMoves(node, metaGame, gameFlags);
    if (node.terminal) break;
    if (node.untriedMoves.length > 0) {
      const expanded = expand(node, metaGame, gameFlags);
      node = expanded.node;
      playoutEngine = expanded.engine;
      break;
    }
    if (node.children.length === 0) break;
    node = selectChild(node, rootPlayer);
  }

  let result;
  if (node.terminal) {
    const engine = createEngine(metaGame, node.state, gameFlags);
    result = evaluateTerminal(engine, rootPlayer);
  } else if (playoutEngine && !playoutEngine.gameover) {
    result = continuePlayout(
      playoutEngine,
      gameFlags,
      rootPlayer,
      MAX_PLAYOUT_PLIES
    );
  } else {
    result = randomPlayout(metaGame, node.state, gameFlags, rootPlayer);
  }

  backpropagate(node, result);
}

function initializeRoot(root, metaGame, gameFlags) {
  const engine = createEngine(metaGame, root.state, gameFlags);
  if (engine.gameover) {
    root.terminal = true;
    root.legalMoveCount = 0;
    root.untriedMoves = [];
    return;
  }

  const moves = uniqueMoves(getLegalMoves(engine, gameFlags));
  root.legalMoveCount = moves.length;
  root.untriedMoves = [...moves];
}

function childWinRate(child) {
  if (child.visits === 0) return null;
  return Math.round((50 + (child.wins / child.visits) * 50) * 10) / 10;
}

function movesEqual(a, b) {
  return a === b;
}

function visitTieThreshold(topVisits) {
  return Math.max(3, Math.round(topVisits * 0.08));
}

function pickBestChild(ranked) {
  if (ranked.length === 0) return null;
  let best = ranked[0];
  const threshold = visitTieThreshold(best.visits);
  for (let i = 1; i < ranked.length; i += 1) {
    const candidate = ranked[i];
    if (best.visits - candidate.visits > threshold) break;
    const bestRate = childWinRate(best) ?? 50;
    const candidateRate = childWinRate(candidate) ?? 50;
    if (candidateRate > bestRate) best = candidate;
  }
  return best;
}

function summarizeSearch(root, iterations, elapsedMs) {
  if (root.children.length === 0) return null;

  const visited = root.children.filter((c) => c.visits > 0);
  const ranked = (visited.length > 0 ? visited : [...root.children]).sort(
    (a, b) => {
      if (b.visits !== a.visits) return b.visits - a.visits;
      return (childWinRate(b) ?? 50) - (childWinRate(a) ?? 50);
    }
  );

  if (ranked.length === 0) return null;

  const best = pickBestChild(ranked);
  const second = ranked.find((child) => !movesEqual(child.move, best.move));
  const winRate = childWinRate(best) ?? 50;
  const totalVisits = root.visits;
  const visitShare =
    totalVisits > 0
      ? Math.round((best.visits / totalVisits) * 1000) / 10
      : 0;
  const secondWinRate = second ? childWinRate(second) : null;
  const rankings = ranked.map((child) => ({
    move: child.move,
    visits: child.visits,
    winRate: childWinRate(child) ?? 50,
    visitShare:
      totalVisits > 0
        ? Math.round((child.visits / totalVisits) * 1000) / 10
        : 0,
  }));

  const marginWinRate =
    second && winRate !== null && secondWinRate !== null
      ? Math.round((winRate - secondWinRate) * 10) / 10
      : null;
  const legalMoveCount = root.legalMoveCount ?? root.children.length;
  const uniformShare = legalMoveCount > 0 ? 100 / legalMoveCount : 100;
  const concentrationRatio =
    Math.round((visitShare / uniformShare) * 100) / 100;
  const lowConfidence =
    legalMoveCount > 15 &&
    (concentrationRatio < 1.5 ||
      (Math.abs(marginWinRate ?? 0) < 1.5 && concentrationRatio < 2.5));

  return {
    move: best.move,
    visits: best.visits,
    winRate,
    iterations,
    elapsedSec: Math.round(elapsedMs / 100) / 10,
    simulationsPerSec:
      elapsedMs > 0 ? Math.round(iterations / (elapsedMs / 1000)) : 0,
    legalMoveCount,
    exploredMoveCount: root.children.filter((c) => c.visits > 0).length,
    visitShare,
    concentrationRatio,
    rankings,
    lowConfidence,
    secondBest: second
      ? {
          move: second.move,
          visits: second.visits,
          winRate: secondWinRate,
        }
      : null,
    marginWinRate,
  };
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

/**
 * Run MCTS for up to timeMs. Returns best root move from root player's perspective.
 */
export async function runMcts({
  metaGame,
  state,
  rootPlayer,
  gameFlags,
  timeMs,
  onProgress,
  signal,
}) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  throwIfAborted(signal);

  const rootEngine = createEngine(metaGame, state, gameFlags);
  if (rootEngine.gameover) return null;

  const resolvedRootPlayer = rootEngine.currplayer - 1;

  const root = new MctsNode({
    state: snapshotState(rootEngine),
    move: null,
    parent: null,
    playerToMove: resolvedRootPlayer,
  });

  initializeRoot(root, metaGame, gameFlags);
  if (root.terminal || root.legalMoveCount === 0) {
    const err = new Error("MCTS has no legal moves at root");
    err.mctsDiagnostics = { legalMoveCount: root.legalMoveCount };
    throw err;
  }

  const deadline = performance.now() + timeMs;
  const searchStarted = performance.now();
  let lastYield = performance.now();
  let iterations = 0;

  while (performance.now() < deadline) {
    const iterationStart = performance.now();
    throwIfAborted(signal);
    runIteration(root, metaGame, gameFlags, resolvedRootPlayer);
    iterations += 1;

    const now = performance.now();
    if (
      now - lastYield >= YIELD_INTERVAL_MS ||
      now - iterationStart >= YIELD_INTERVAL_MS
    ) {
      onProgress?.({ iterations, rootVisits: root.visits });
      await new Promise((resolve) => setTimeout(resolve, 0));
      lastYield = performance.now();
      throwIfAborted(signal);
    }
  }

  const elapsedMs = performance.now() - searchStarted;
  const summary = summarizeSearch(root, iterations, elapsedMs);
  if (!summary) {
    const err = new Error("MCTS produced no recommendation");
    err.mctsDiagnostics = {
      iterations,
      legalMoveCount: root.legalMoveCount,
      childCount: root.children.length,
      rootVisits: root.visits,
    };
    throw err;
  }
  return summary;
}
