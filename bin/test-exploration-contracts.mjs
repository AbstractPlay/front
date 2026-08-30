/**
 * Real-engine exploration contract + integration tests.
 * Run via: npm run test:engines
 *
 * Loads @abstractplay/gameslib via ESM (browser/node entry) and front src modules
 * via dynamic import (Vite-era CRA-style .js under src/).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = (rel) =>
  pathToFileURL(path.join(__dirname, "../src", rel)).href;

const gameslibPkgPath = path.join(
  __dirname,
  "../node_modules/@abstractplay/gameslib/package.json",
);
const gameslibVersion = JSON.parse(readFileSync(gameslibPkgPath, "utf8")).version;

const [
  {
    isPartialExplorationMove,
    isPersistableExplorationMove,
    filterPersistableExplorationTree,
  },
  { getPendingSubmitMove },
  { EXPLORATION_CONTRACTS },
  { GameNode },
  { GameFactory, gameinfo },
] = await Promise.all([
  import(src("lib/GameMove/explorationMoves.js")),
  import(src("lib/GameMove/submitMove.js")),
  import(src("lib/GameMove/fixtures/index.js")),
  import(src("components/GameMove/GameTree.js")),
  import("@abstractplay/gameslib"),
]);

function partitionContracts(contracts) {
  console.log(`@abstractplay/gameslib@${gameslibVersion}`);
  assert.equal(
    typeof GameFactory,
    "function",
    "GameFactory missing from @abstractplay/gameslib"
  );

  const active = [];
  const skipped = [];

  for (const contract of contracts) {
    if (gameinfo.has(contract.metaGame)) {
      active.push(contract);
    } else if (contract.developmentOnly) {
      skipped.push(contract);
      console.log(
        `skip ${contract.id}: ${contract.metaGame} not in registry (developmentOnly)`
      );
    } else {
      assert.fail(
        `${contract.id}: metaGame "${contract.metaGame}" is missing from gameslib@${gameslibVersion} ` +
          "(production gameslib builds omit experimental games from the registry)"
      );
    }
  }

  console.log(
    `contracts: ${active.length} active, ${skipped.length} skipped (developmentOnly)`
  );
  return active;
}

function createEngine(contract) {
  const engine = contract.state
    ? GameFactory(contract.metaGame, contract.state)
    : GameFactory(contract.metaGame);
  assert.ok(
    engine,
    `${contract.id}: GameFactory returned undefined for metaGame "${contract.metaGame}" (not in this gameslib build?)`
  );
  return engine;
}

function moveContext(contract) {
  const ctx = { metaGame: contract.metaGame };
  if (contract.simultaneous) {
    ctx.simultaneous = true;
    ctx.playerIndex = contract.playerIndex ?? 0;
    ctx.numPlayers = contract.numPlayers ?? 2;
  }
  return ctx;
}

function assertContract(contract) {
  const { move, whileEditing, afterComplete } = contract;
  const ctx = moveContext(contract);

  const editingEngine = createEngine(contract);
  assert.equal(
    isPartialExplorationMove(editingEngine, move, ctx),
    whileEditing.partial,
    `${contract.id}: whileEditing.partial`
  );
  assert.equal(
    isPersistableExplorationMove(editingEngine, move, ctx),
    whileEditing.persistable,
    `${contract.id}: whileEditing.persistable`
  );

  const completeEngine = createEngine(contract);
  assert.equal(
    isPartialExplorationMove(completeEngine, move, {
      userCompleted: true,
      ...ctx,
    }),
    afterComplete.partial,
    `${contract.id}: afterComplete.partial`
  );
  assert.equal(
    isPersistableExplorationMove(completeEngine, move, ctx),
    afterComplete.persistable,
    `${contract.id}: afterComplete.persistable`
  );
}

function runCompleteMoveFlow(contract) {
  const engine = createEngine(contract);
  const game = {
    metaGame: contract.metaGame,
    state: engine.serialize(),
    canSubmit: true,
  };

  const exploration = [
    new GameNode(null, "", game.state, engine.currplayer - 1),
  ];
  let focus = { moveNumber: 0, exPath: [] };

  const ctx = moveContext(contract);
  if (contract.simultaneous) {
    engine.validateMove(contract.move, (contract.playerIndex ?? 0) + 1);
  } else {
    engine.validateMove(contract.move);
  }
  const editingPartial = isPartialExplorationMove(engine, contract.move, ctx);

  const afterEditing = {
    pendingSubmit: getPendingSubmitMove(exploration, focus, {
      canSubmit: game.canSubmit,
    }),
    partial: editingPartial,
    exPathLength: focus.exPath.length,
  };

  const completePartial = isPartialExplorationMove(engine, contract.move, {
    userCompleted: true,
    ...ctx,
  });

  if (!completePartial && contract.move.length > 0) {
    const node = exploration[focus.moveNumber];
    const pos = node.AddChild(contract.move, engine);
    focus = { moveNumber: 0, exPath: [pos] };
  }

  const afterComplete = {
    pendingSubmit: getPendingSubmitMove(exploration, focus, {
      canSubmit: game.canSubmit,
    }),
    partial: completePartial,
    exPathLength: focus.exPath.length,
  };

  return { afterEditing, afterComplete };
}

function assertIntegration(contract) {
  if (contract.submitAfterComplete === undefined) {
    return;
  }

  const { afterEditing, afterComplete } = runCompleteMoveFlow(contract);

  assert.equal(
    afterEditing.pendingSubmit,
    null,
    `${contract.id}: no submit while editing`
  );
  assert.equal(
    afterEditing.exPathLength,
    0,
    `${contract.id}: empty exPath while editing`
  );
  assert.equal(
    afterEditing.partial,
    contract.whileEditing.partial,
    `${contract.id}: partial while editing`
  );

  if (contract.submitAfterComplete) {
    assert.equal(
      afterComplete.pendingSubmit,
      contract.move,
      `${contract.id}: submit after complete`
    );
    assert.equal(
      afterComplete.exPathLength,
      1,
      `${contract.id}: exPath after complete`
    );
    assert.equal(
      afterComplete.partial,
      false,
      `${contract.id}: not partial after complete`
    );
  } else {
    assert.equal(
      afterComplete.pendingSubmit,
      null,
      `${contract.id}: no submit after complete`
    );
  }
}

function testPendingSubmitAfterAutomove() {
  const exploration = [new GameNode(null, "", "{}", 0)];
  exploration[0].children = [
    new GameNode(exploration[0], "h6-i5", "{}", 1),
  ];
  exploration[0].children[0].children = [
    new GameNode(exploration[0].children[0], "forced-reply", "{}", 0),
  ];

  const afterAutomove = { moveNumber: 0, exPath: [0, 0] };

  assert.equal(
    getPendingSubmitMove(exploration, afterAutomove, { canSubmit: true }),
    "h6-i5",
    "pending submit after automove (exPath depth > 1)"
  );
  assert.equal(
    getPendingSubmitMove(exploration, { moveNumber: 0, exPath: [0] }, {
      canSubmit: true,
    }),
    "h6-i5",
    "pending submit at submit node (exPath depth 1)"
  );
  assert.equal(
    getPendingSubmitMove(exploration, { moveNumber: 0, exPath: [] }, {
      canSubmit: true,
    }),
    null,
    "no pending submit at current position"
  );
  assert.equal(
    getPendingSubmitMove(exploration, afterAutomove, { canSubmit: false }),
    null,
    "no pending submit when canSubmit is false"
  );
}

function testCarnacFilterTree() {
  const tip = EXPLORATION_CONTRACTS.find((c) => c.id === "carnac-tip-prefix");
  const compound = EXPLORATION_CONTRACTS.find(
    (c) => c.id === "carnac-complete-tip"
  );
  const engine = createEngine(tip);

  const filtered = filterPersistableExplorationTree(
    engine,
    [
      { move: tip.move, children: [] },
      { move: compound.move, children: [] },
    ],
    tip.metaGame
  );

  assert.deepEqual(
    filtered.map((c) => c.move),
    [compound.move],
    "carnac filter tree"
  );
}

function testEntropyFilterTree() {
  const partial = EXPLORATION_CONTRACTS.find(
    (c) => c.id === "entropy-order-partial-d5"
  );
  const complete = EXPLORATION_CONTRACTS.find(
    (c) => c.id === "entropy-order-complete-d5-d4"
  );
  const chaos = EXPLORATION_CONTRACTS.find(
    (c) => c.id === "entropy-chaos-placement-d4"
  );
  const ctx = moveContext(partial);
  const orderEngine = createEngine(partial);

  const orderFiltered = filterPersistableExplorationTree(
    orderEngine,
    [
      { move: partial.move, children: [] },
      { move: complete.move, children: [] },
    ],
    ctx
  );
  assert.deepEqual(
    orderFiltered.map((c) => c.move),
    [complete.move],
    "entropy order filter tree"
  );

  const chaosEngine = createEngine(chaos);
  const chaosFiltered = filterPersistableExplorationTree(
    chaosEngine,
    [{ move: chaos.move, children: [] }],
    moveContext(chaos)
  );
  assert.deepEqual(
    chaosFiltered.map((c) => c.move),
    [chaos.move],
    "entropy chaos filter tree"
  );
}

let passed = 0;
const activeContracts = partitionContracts(EXPLORATION_CONTRACTS);
for (const contract of activeContracts) {
  assertContract(contract);
  assertIntegration(contract);
  passed += 1;
}
testPendingSubmitAfterAutomove();
passed += 1;
testCarnacFilterTree();
passed += 1;
testEntropyFilterTree();
passed += 1;

console.log(
  `exploration engine tests: ${passed} scenarios passed (${activeContracts.length} contracts + pending submit after automove + filter trees)`
);
