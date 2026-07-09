# Game move

The game move page is the core gameplay UI. Route: `/move/:metaGame/:cbits/:gameID`.

## Key files

| File | Role |
|------|------|
| [`GameMoveWrapper.js`](../src/components/GameMoveWrapper.js) | Remounts `GameMove` on param change |
| [`GameMove.js`](../src/components/GameMove.js) | Main game page (~3k lines) |
| [`src/lib/GameMove/`](../src/lib/GameMove/exploration.js) | Game setup, exploration, settings helpers |
| [`GameMove/Board.js`](../src/components/GameMove/Board.js) | SVG board via renderer |
| [`GameMove/MoveEntry.js`](../src/components/GameMove/MoveEntry.js) | Move input UI |
| [`GameMove/GameMoves.js`](../src/components/GameMove/GameMoves.js) | Move history list |
| [`GameMove/UserChats.js`](../src/components/GameMove/UserChats.js) | In-game chat |

## Data flow

1. **Load game** — open query `get_game` with `metaGame`, `cbits`, `gameID`.
2. **Instantiate rules** — `GameFactory` from `@abstractplay/gameslib` builds the game object from stored state.
3. **Render board** — game `render()` produces JSON; `@abstractplay/renderer` `render()` produces SVG.
4. **Submit move** — auth query (e.g. `submit_move`) via `callAuthApi`.
5. **Real-time updates** — WebSocket messages refresh game state when opponent moves.

Backend semantics: [Games and moves](/backend/subsystems/games-and-moves/).

## Move entry

`MoveEntry` handles click/tap input, legal move highlighting, and validation through gameslib before submission. Game-specific flags in `gameinfo` (e.g. `pie`, `check`, `no-moves`) affect UI behaviour — see [Gameslib flags](/gameslib/flags/).

## Exploration

Private and public move exploration (what-if analysis) lives in [`src/lib/GameMove/exploration.js`](../src/lib/GameMove/exploration.js). Users can branch from historical positions, comment on nodes, and publish exploration trees.

## Settings and display

[`src/lib/GameMove/settings.js`](../src/lib/GameMove/settings.js) manages colour schemes, display variants, and renderer options. Session overrides persist across reloads via [`sessionDisplay.js`](../src/lib/GameMove/sessionDisplay.js).

## Themes

Colour context from Zustand and user customizations feed into renderer via [`setRendererColourOpts`](../src/lib/setRendererColourOpts.js) and [`setGlyphMapOpt`](../src/lib/setGlyphMapOpt.js). See [Customize & themes](/front/subsystems/customize/).

## Lab integration

Games supported in the Lab can be opened from the game move page. See [`isLabSupportedGame`](../src/lib/Lab/buildGame.js) and [Lab](/front/subsystems/lab/).

## Related

- [API client](/front/api/client/)
- [WebSockets](/front/subsystems/websockets/)
- [Gameslib](/gameslib/)
- [Renderer](/renderer/)
