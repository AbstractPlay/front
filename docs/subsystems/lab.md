# Lab

The Lab is a sandbox for exploring games without creating a server-side game record. Route: `/playground` (alias: `/lab` redirects here).

## Deep link from game pages

- **URL:** `/playground?metaGame=<catalog-uid>` (normalized via `resolveMetaGameUid`).
- Game landing pages link here with **Launch in Playground** when [`isLabSupportedGame`](../src/lib/Lab/buildGame.js) is true (solo-only catalog titles are excluded).
- When the query param is present, **session autosave (`lastSession`) is not restored** — the link wins over an in-progress device session.
- If the game needs a player count and/or variant choices, the launcher opens with that game pre-selected; otherwise a fresh session starts immediately.
- After handling, the client replaces the URL with `/playground` (no query) so refresh does not re-trigger auto-start.

Helpers live in [`playgroundLaunch.js`](../src/lib/Lab/playgroundLaunch.js).

## Key files

| File | Role |
|------|------|
| [`Lab/Lab.js`](../src/components/Lab/Lab.js) | Main lab page |
| [`Lab/LabLauncher.js`](../src/components/Lab/LabLauncher.js) | Game selection and session start |
| [`Lab/LabSession.js`](../src/components/Lab/LabSession.js) | Active lab session |
| [`Lab/LabSaveModal.js`](../src/components/Lab/LabSaveModal.js) | Save / update / save-as-new dialog |
| [`Lab/Board.js`](../src/components/Lab/Board.js) | Board rendering |
| [`Lab/GameTree.js`](../src/components/Lab/GameTree.js) | Move tree navigation |
| [`src/lib/Lab/`](../src/lib/Lab/buildGame.js) | Game building, storage, settings |
| [`src/lib/Lab/savePayload.js`](../src/lib/Lab/savePayload.js) | Shared save body format |
| [`src/lib/Lab/playgroundSavesApi.js`](../src/lib/Lab/playgroundSavesApi.js) | Cloud save CRUD |

## Behaviour

- Games run in the browser using `@abstractplay/gameslib`.
- **Logged out:** named saves and session autosave use `localStorage` only.
- **Logged in:** named saves sync to the account via `authQuery` playground endpoints; session autosave (`lastSession`) remains on-device for quick resume.
- Users with existing local named saves see an optional banner to copy them to their account; remaining device-only saves appear under “On this device”.
- Save UX: one **Save** button; when editing a loaded save, a modal offers **Update** or **Save as new**.
- Supports branching, undo, and alternate displays for supported games.
- [`isLabSupportedGame`](../src/lib/Lab/buildGame.js) gates which games appear in the launcher.

## Overlap with GameMove

Lab reuses renderer and gameslib patterns from the live game page but does not call move-submission auth queries. Display settings helpers are shared via [`src/lib/Lab/settings.js`](../src/lib/Lab/settings.js).

**Move tree / move table:** Lab and live use separate React components but share much of `src/lib/GameMove/` (layout, variations, column filter). Playground-only shims live under `src/lib/Lab/labMoveTable*.js`. See [Lab and Game Move coupling](/front/subsystems/lab-gamemove-coupling/) before changing shared move-table code.

## Related

- [Game move](/front/subsystems/game-move/)
- [Gameslib](/gameslib/)
- [Renderer](/renderer/)
