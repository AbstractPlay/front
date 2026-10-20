# Lab and Game Move coupling

Playground (Lab) and live play (Game Move) are **two product surfaces** with **different exploration rules**, but they still share a large slice of move-table and engine-move code under `src/lib/GameMove/`. Changes there can fix live play while breaking the Lab, or the reverse, even when only one UI file is edited.

This page is the map for contributors: what is already split, what is shared, regression risk, and where Lab-only shims live.

## Parallel stacks (already separate)

| Concern | Lab | Live (Game Move) |
|--------|-----|------------------|
| Move panel UI | [`src/components/Lab/GameMoves.js`](../../src/components/Lab/GameMoves.js) | [`src/components/GameMove/GameMoves.js`](../../src/components/GameMove/GameMoves.js) |
| Tree node class | [`src/components/Lab/GameTree.js`](../../src/components/Lab/GameTree.js) | [`src/components/GameMove/GameTree.js`](../../src/components/GameMove/GameTree.js) |
| Exploration policy, persistence, `canExploreMove` | [`src/lib/Lab/exploration.js`](../../src/lib/Lab/exploration.js) | [`src/lib/GameMove/exploration.js`](../../src/lib/GameMove/exploration.js) |
| Session move routing | [`src/lib/Lab/gameStuff.js`](../../src/lib/Lab/gameStuff.js) | [`src/lib/GameMove/gameStuff.js`](../../src/lib/GameMove/gameStuff.js) |

Lab allows exploring from **any rewound mainline position**; live play restricts in-progress exploration to the **mainline tip** (see `canExploreMove` in each `exploration.js`). Policy is split; **rendering and layout are not**.

## Lab-only move-table shims (Playground regressions)

Added so Playground can diverge without changing live `GameMoves`:

| File | Purpose |
|------|---------|
| [`src/lib/Lab/labMoveTableVariations.js`](../../src/lib/Lab/labMoveTableVariations.js) | Next-ply branch choice list and substitution when focus is **before** a branch; wraps live `collectVariationChoices` / `shouldSubstituteVariationChoicesAtCell` where appropriate |
| [`src/lib/Lab/labMoveTablePathCells.js`](../../src/lib/Lab/labMoveTablePathCells.js) | Keeps mainline + local exploration siblings in **one column** for rewind branches; then delegates to live `filterPathCellsForSeat` |

Tests: [`labMoveTableVariations.test.js`](../../src/lib/Lab/labMoveTableVariations.test.js), [`labMoveTablePath.test.js`](../../src/lib/Lab/labMoveTablePath.test.js).

**Display gating in Lab UI:** [`GameMoves.js`](../../src/components/Lab/GameMoves.js) uses `isIdleMainlineExplorationTip` from shared `moveTreeVariations` for when to use the compact in-progress path vs the full tree. Live `GameMoves` uses `!game.gameOver` for the compact path (tip-only in practice). Do not assume the two components follow the same `if` without reading both files.

## High-risk shared modules (Lab imports → live code)

These are used directly from **Lab `GameMoves`** or Lab shims. Editing them for a live-only bug can break Playground.

| Module | Lab usage | Risk |
|--------|-----------|------|
| [`moveTableLayout.js`](../../src/lib/GameMove/moveTableLayout.js) | Grid layout, path index → cell, rounds, density, export engine resolution | Path rows/columns wrong or branches at wrong ply |
| [`moveTreeVariations.js`](../../src/lib/GameMove/moveTreeVariations.js) | `collectVariationChoices`, `isIdleMainlineExplorationTip`, path/focus helpers, `moveCellsFromVariationChoices` | Branch lists, ↑/↓, substitution eligibility |
| [`moveTablePathCells.js`](../../src/lib/GameMove/moveTablePathCells.js) | `filterPathCellsForSeat` (via Lab wrapper), `resolveMoveTablePlayerSeats` | Column assignment (hex tip vs rewind branch) |
| [`moveTreeCellClasses.js`](../../src/lib/GameMove/moveTreeCellClasses.js) | `buildMoveCellClass`, `pathHasExplorationMoves`, `isExplorationPath` | Legend and exploration styling |

### Duplication inside Lab (drift risk, not shared import)

Lab [`GameMoves.js`](../../src/components/Lab/GameMoves.js) embeds its own **`getPath`**, **`nextVarFocus`**, and **`prevVarFocus`**. Live play uses [`moveTreeKeyboard.js`](../../src/lib/GameMove/moveTreeKeyboard.js). Behavior is meant to align but the code is **not** shared—fixes in one copy may not reach the other.

## Medium-risk shared modules (engine contract)

| Module | Lab usage |
|--------|-----------|
| [`explorationMoves.js`](../../src/lib/GameMove/explorationMoves.js) | `applyExplorationMove`, `isPartialExplorationMove` in Lab exploration / `gameStuff` |
| [`explorationOutcome.js`](../../src/lib/GameMove/explorationOutcome.js) | Outcome propagation on `GameNode` (both tree implementations) |
| [`moveTableLayout.js`](../../src/lib/GameMove/moveTableLayout.js) | `resolveMoveTableExportEngine` from [`hiddenView.js`](../../src/lib/Lab/hiddenView.js) |

These reflect **gameslib move wire format** and annotations. Sharing is usually intentional; forks are costly unless Lab needs a different contract.

## Low-risk shared pieces

| Piece | Lab usage |
|-------|-----------|
| [`moveTreeKeyboard.js`](../../src/lib/GameMove/moveTreeKeyboard.js) | `shouldSkipMoveTreeKeyboard` only |
| [`ExplorationOutcomeIndicator.js`](../../src/components/GameMove/ExplorationOutcomeIndicator.js) | Win/draw/loss markers in move cells |
| [`moveTablePathCells.js`](../../src/lib/GameMove/moveTablePathCells.js) | `resolveMoveTablePlayerSeats` |

## Reverse coupling (live → Lab)

Not move-table rendering, but **product bridges**:

[`useGameMoveSession.js`](../../src/components/GameMove/useGameMoveSession.js) imports Lab for export-to-Playground, teach-from-position, and session exploration serialization:

- [`lib/Lab/settings.js`](../../src/lib/Lab/settings.js)
- [`lib/Lab/buildGame.js`](../../src/lib/Lab/buildGame.js) (`isLabSupportedGame`)
- [`lib/Lab/storage.js`](../../src/lib/Lab/storage.js), [`lib/Lab/exploration.js`](../../src/lib/Lab/exploration.js) (`serializeSessionExploration`)

Integration tests under `src/lib/GameMove/*playground*` import Lab `GameTree` / `export` for fixtures only.

## Historical note (Oct 2026 move-tree regression)

Commit `c35b57a3` changed Lab `GameMoves` to gate the path builder on `!game.gameOver` instead of `isIdleMainlineExplorationTip`, while Lab routing still allowed mid-line exploration. The board updated; the move list did not. Restoration used `isIdleMainlineExplorationTip` in Lab only; subsequent branch visibility work added the `lib/Lab/labMoveTable*` shims so column/split behavior need not match live hex tip rows.

## When changing move trees

1. **Identify surface:** Lab `GameMoves` vs live `GameMoves` vs shared `lib/GameMove/*`.
2. **Playground-only behavior** → extend `lib/Lab/labMoveTable*` or Lab `GameMoves`; avoid changing `collectVariationChoices` / `filterPathCellsForSeat` unless live must change too.
3. **Run tests:** `src/lib/Lab/labMoveTable*.test.js`, `src/lib/GameMove/moveTreeVariations.test.js`, `moveTablePathCells.test.js`, `hexProdMoveTable.integration.test.js` as appropriate.
4. **Manual:** Rewind in Playground, branch at ply 2+, confirm a/b list and legend; smoke live exploration at tip and finished-game rewind.

## Related

- [Lab](/front/subsystems/lab/)
- [Game move](/front/subsystems/game-move/)
- Optional decoupling plan (phased fork of high-risk modules): `lab-gamemove-decoupling.plan.md` in your Cursor plans folder (local; not in repo).
