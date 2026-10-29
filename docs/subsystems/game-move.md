# Game move

The game move page is the core gameplay UI.

## Routes

| Route | Behaviour |
|-------|-----------|
| `/move/:metaGame/:cbits/:gameID` | Primary play page; optional `?layout=classic\|strip\|card\|narrative\|live` |
| `/arena/play/:metaGame/:gameID` | Arena live play; optional `?layout=` (uses `gameMoveLayoutLive`) |
| `/arena/watch/:metaGame/:gameID` | Arena spectate; optional `?layout=` (uses `gameMoveLayoutLive`) |
| `/move-beta/:metaGame/:cbits/:gameID` | Legacy preview URL → redirects to `/move/...` preserving `?layout=` |

**Layout resolution** (see [`layoutPreference.js`](../src/lib/GameMove/layoutPreference.js)):

1. Valid `?layout=` in the URL → use for this visit (shareable deep links); persisted to the matching localStorage key for the route kind
2. **Correspondence** (`/move/…`): `localStorage` key `gameMoveLayout` (migrated from `gameMoveBetaLayout`); default **strip**
3. **Live arena** (`/arena/play`, `/arena/watch`): `localStorage` key `gameMoveLayoutLive`; default **live**
4. Arena table lobby offers layout choice (text description) before launch

Preferences are **localStorage only** (per browser/device). Correspondence and live arena remember **separate** layout choices. Layout switcher links on arena routes stay on `/arena/play` or `/arena/watch` (via `gameMovePath` `basePath`). No account setting.

## Layouts

| ID | Component | Summary |
|----|-----------|---------|
| `classic` | [`GameMoveClassicLayout.js`](../src/components/GameMove/GameMoveClassicLayout.js) | Original full-page layout |
| `strip` | [`GameMoveStripLayout.js`](../src/components/GameMove/layouts/GameMoveStripLayout.js) | Board hero, sticky dock, tabbed drawer (default on `/move`) |
| `card` | [`GameMoveCardLayout.js`](../src/components/GameMove/layouts/GameMoveCardLayout.js) | Queue card for playing through your inbox |
| `narrative` | [`GameMoveNarrativeLayout.js`](../src/components/GameMove/layouts/GameMoveNarrativeLayout.js) | Story column beside the board |
| `live` | [`GameMoveLiveLayout.js`](../src/components/GameMove/layouts/GameMoveLiveLayout.js) | Clock-first bar, move dock, drawer (default on arena) |

All five layouts are available to anonymous and logged-in users on both correspondence and arena routes (each context remembers its own choice).

## Key files

| File | Role |
|------|------|
| [`GameMoveWrapper.js`](../src/components/GameMoveWrapper.js) | Route wrapper; `/move-beta/` redirect |
| [`GameMoveShell.js`](../src/components/GameMoveShell.js) | Unified shell: layout switch, picker modal, session load |
| [`useGameMoveLayout.js`](../src/hooks/useGameMoveLayout.js) | `layoutId` + `resolvedFrom` from URL / localStorage / default |
| [`layoutPreference.js`](../src/lib/GameMove/layoutPreference.js) | Layout IDs, paths, localStorage read/write, hint helpers |
| [`layoutTracking.js`](../src/lib/GameMove/layoutTracking.js) | Fire-and-forget layout analytics emitter |
| [`useGameMoveSession.js`](../src/components/GameMove/useGameMoveSession.js) | Game load, moves, chats, modals |
| [`GameMove/Board.js`](../src/components/GameMove/Board.js) | SVG board via renderer |
| [`GameMove/MoveEntry.js`](../src/components/GameMove/MoveEntry.js) | Move input UI |
| [`GameMove/GameMoves.js`](../src/components/GameMove/GameMoves.js) | Move history list |
| [`GameMove/UserChats.js`](../src/components/GameMove/UserChats.js) | In-game chat |

## Discoverability

- **Layout picker** — header trigger (`LayoutPickerTrigger`) on all five layouts opens a modal (`LayoutPickerModal`) with descriptions for each layout (`LayoutSwitcher`).
- **First-visit hint** — on strip when the user has no saved layout and no `?layout=` URL, a dismissible notice (`LayoutHint`) offers “Change layout”. Dismissal is stored in `gameMoveLayoutHintDismissed`.

There is no permanent floating layout bar.

## Analytics

[`layoutTracking.js`](../src/lib/GameMove/layoutTracking.js) emits:

| Event | When |
|-------|------|
| `session_start` | After game load when layout is resolved (`GameMoveShell`) |
| `layout_switch` | User picks another layout in the switcher (`LayoutSwitcher`) |

Logged-in users call auth `log_gamemove_layout_event`. Anonymous users call the public query with a per-page `sessionId` and a **25 events / UTC day** client cap. Server-side limits and storage are documented in [Game Move layout analytics](/backend/subsystems/game-move-layout-analytics/).

## Data flow

1. **Load game** — open query `get_game` with `metaGame`, `cbits`, `gameID`.
2. **Instantiate rules** — `GameFactory` from `@abstractplay/gameslib` builds the game object from stored state.
3. **Render board** — game `render()` produces JSON (`APRenderRep`, a frame array, or `kind: "composite"`). The client calls `@abstractplay/renderer` `render()` or `renderComposite()` (one SVG). Composite `boardClick` / `boardHover` include `panelId`; stacking-expanding games still use `renderColumn(col, row, panelId?)` for the side stack rep.
4. **Submit move** — auth query (e.g. `submit_move`) via `callAuthApi`.
5. **Real-time updates** — WebSocket messages refresh game state when opponent moves.

**Arena time loss:** Hard-clock arena games end on the server (EventBridge Scheduler → `arenaFlagWorker` → `timeloss`). The play page does **not** call auth `timeloss` for `playMode: 'arena'`; seated players and spectators rely on the existing `verb: "game"` WebSocket → `refresh-data` → `get_game` after the server archives the game. Correspondence hard-clock games still use client `timeloss` hints where there is no scheduler.

**Arena start:** When both players ready, the server creates the game and pushes **`arena_launch`** (WebSocket) so both clients navigate to play without waiting on lobby poll. Each client calls **`arena_play_ready`** after the board renders; when both have pinged, the server sets **`arenaClockStartAt`** (now + 3s), broadcasts **`arena_sync`**, and Fischer time runs from that instant. A countdown overlay covers the board until then.

Backend semantics: [Games and moves](/backend/subsystems/games-and-moves/), [Realtime Arena](/backend/subsystems/arena/).

## Move entry

`MoveEntry` handles click/tap input, legal move highlighting, and validation through gameslib before submission. Game-specific flags in `gameinfo` (e.g. `pie`, `check`, `no-moves`) affect UI behaviour — see [Gameslib flags](/gameslib/flags/).

## Exploration

Private and public move exploration (what-if analysis) lives in [`exploration.js`](../src/lib/GameMove/exploration.js). Users can branch from historical positions, comment on nodes, and publish exploration trees.

**Local replay (contributors):** frozen snapshots and `?replay=` on `/move` for seat-specific UI debugging — see [Game Move replay (local)](/front/guides/gamemove-replay/).

## Settings and display

[`settings.js`](../src/lib/GameMove/settings.js) manages colour schemes, display variants, and renderer options. Session overrides persist across reloads via [`sessionDisplay.js`](../src/lib/GameMove/sessionDisplay.js).

## Themes

Colour context from Zustand and user customizations feed into renderer via [`setRendererColourOpts`](../src/lib/setRendererColourOpts.js) and [`setGlyphMapOpt`](../src/lib/setGlyphMapOpt.js). See [Customize & themes](/front/subsystems/customize/).

## Lab integration

Games supported in the Lab can be opened from the game move page. See [`isLabSupportedGame`](../src/lib/Lab/buildGame.js) and [Lab](/front/subsystems/lab/).

## Related

- [API client](/front/api/client/)
- [WebSockets](/front/subsystems/websockets/)
- [Game Move layout analytics](/backend/subsystems/game-move-layout-analytics/)
- [Gameslib](/gameslib/)
- [Renderer](/renderer/)
