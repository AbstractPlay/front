/**
 * Real-engine exploration contract + integration tests.
 * Run via: npm run test:engines
 *
 * Jest cannot reliably load @abstractplay/gameslib/build (CRA resolves the
 * package's TypeScript sources instead). This script uses Node's resolver
 * until the Vite migration gives us a cleaner test runner setup.
 *
 * Requires Node 20+ (CI matches this) so Node can load CRA-style ESM in .js
 * files under src/ without "type": "module" in package.json.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const src = (rel) =>
  pathToFileURL(path.join(__dirname, "../src", rel)).href;

const [
  {
    isPartialExplorationMove,
    isPersistableExplorationMove,
    filterPersistableExplorationTree,
  },
  { getPendingSubmitMove },
  { EXPLORATION_CONTRACTS },
  { GameNode },
] = await Promise.all([
  import(src("lib/GameMove/explorationMoves.js")),
  import(src("lib/GameMove/submitMove.js")),
  import(src("lib/GameMove/fixtures/index.js")),
  import(src("components/GameMove/GameTree.js")),
]);
// Use compiled build output (matches Jest moduleNameMapper and avoids TS/ESM resolution drift).
const { GameFactory } = require("@abstractplay/gameslib/build/index.js");
const { games: gamesRegistry } = require("@abstractplay/gameslib/build/games/index.js");
const gameslibVersion = require("@abstractplay/gameslib/package.json").version;

function assertGameslibReady(contracts) {
  console.log(`@abstractplay/gameslib@${gameslibVersion}`);
  assert.equal(
    typeof GameFactory,
    "function",
    "GameFactory missing from @abstractplay/gameslib/build"
  );

  const metaGames = [...new Set(contracts.map((c) => c.metaGame))];
  const missing = metaGames.filter((uid) => !gamesRegistry.has(uid));
  assert.equal(
    missing.length,
    0,
    `gameslib@${gameslibVersion} is missing registry entries for: ${missing.join(", ")}. ` +
      "Ensure ci-deps.json pins a gameslib build that includes these games " +
      "(production gameslib builds omit experimental games from the registry)."
  );
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

function assertContract(contract) {
  const { move, metaGame, whileEditing, afterComplete } = contract;

  const editingEngine = createEngine(contract);
  assert.equal(
    isPartialExplorationMove(editingEngine, move, { metaGame }),
    whileEditing.partial,
    `${contract.id}: whileEditing.partial`
  );
  assert.equal(
    isPersistableExplorationMove(editingEngine, move, metaGame),
    whileEditing.persistable,
    `${contract.id}: whileEditing.persistable`
  );

  const completeEngine = createEngine(contract);
  assert.equal(
    isPartialExplorationMove(completeEngine, move, {
      userCompleted: true,
      metaGame,
    }),
    afterComplete.partial,
    `${contract.id}: afterComplete.partial`
  );
  assert.equal(
    isPersistableExplorationMove(completeEngine, move, metaGame),
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

  engine.validateMove(contract.move);
  const editingPartial = isPartialExplorationMove(engine, contract.move, {
    metaGame: contract.metaGame,
  });

  const afterEditing = {
    pendingSubmit: getPendingSubmitMove(exploration, focus, {
      canSubmit: game.canSubmit,
    }),
    partial: editingPartial,
    exPathLength: focus.exPath.length,
  };

  const completePartial = isPartialExplorationMove(engine, contract.move, {
    userCompleted: true,
    metaGame: contract.metaGame,
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

let passed = 0;
assertGameslibReady(EXPLORATION_CONTRACTS);
for (const contract of EXPLORATION_CONTRACTS) {
  assertContract(contract);
  assertIntegration(contract);
  passed += 1;
}
testCarnacFilterTree();
passed += 1;

console.log(
  `exploration engine tests: ${passed} scenarios passed (${EXPLORATION_CONTRACTS.length} contracts + filter tree)`
);
