# Lab

The Lab is an offline sandbox for exploring games without creating a server-side game record. Route: `/lab` (alias: `/playground` redirects here).

## Key files

| File | Role |
|------|------|
| [`Lab/Lab.js`](../src/components/Lab/Lab.js) | Main lab page |
| [`Lab/LabLauncher.js`](../src/components/Lab/LabLauncher.js) | Game selection and session start |
| [`Lab/LabSession.js`](../src/components/Lab/LabSession.js) | Active lab session |
| [`Lab/Board.js`](../src/components/Lab/Board.js) | Board rendering |
| [`Lab/GameTree.js`](../src/components/Lab/GameTree.js) | Move tree navigation |
| [`src/lib/Lab/`](../src/lib/Lab/buildGame.js) | Game building, storage, settings |

## Behaviour

- Games run entirely in the browser using `@abstractplay/gameslib`.
- Session state is stored in `localStorage` (no backend persistence).
- Supports branching, undo, and alternate displays for supported games.
- [`isLabSupportedGame`](../src/lib/Lab/buildGame.js) gates which games appear in the launcher.

## Overlap with GameMove

Lab reuses renderer and gameslib patterns from the live game page but does not call move-submission auth queries. Display settings helpers are shared via [`src/lib/Lab/settings.js`](../src/lib/Lab/settings.js).

## Related

- [Game move](/front/subsystems/game-move/)
- [Gameslib](/gameslib/)
- [Renderer](/renderer/)
