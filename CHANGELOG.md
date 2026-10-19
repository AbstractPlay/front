# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Since the `1.0.0-beta` release, the version in `package.json` has stayed at `1.0.0-beta`. Production and dev deploys stamp `1.0.0-ci-<GitHub Actions run id>.0` during the workflow (see `.github/workflows/deploy-prod.js.yml` and `deploy-dev.js.yml`). Entries below are grouped by theme and approximate ship window on **main** (what runs at abstractplay.com); they are not a per-commit log.

**Monthly batching (agents):** Use **one** `## [1.0.0-ci] - YYYY-MM-DD` header per calendar month. Before editing, search this file for `- YYYY-MM-` (today’s year-month); if a section exists, append bullets under `### Added` / `### Changed` / `### Fixed` there and set that header’s date to today — do **not** add a second `##` for the same month. A new ship day is not a new section.

## [1.0.0-ci] - 2026-10-19

### Added

- **Game landing page:** Summary tab shows the date the game was added to the site (from gameslib `dateAdded`).
- **Composite board rendering:** Game Move and Lab call `renderComposite` when `render()` returns `kind: "composite"`; `panelId` on board clicks; stacking-expanding hover uses `renderColumn(col, row, panelId?)` for the side stack.
- **Event log:** ply numbers link to that position on the board and move tree.
- **Tournaments:** tournament chat on `/tournament/{id}` (Markdown, participant/admin post); `watchTournaments` WebSocket refresh; in-app `tournamentChat` notification preference and bell copy.
- **Ops:** `ap:service` and `ap:stage` cost-allocation tags on the `apfront` Serverless stack, play S3 buckets (via `serverless client deploy`), and CloudFront distributions (via CSP sync).
- **Bots:** edit bot screen lists supported games and variant combinations; add or remove entries and save via `update_bot`.
- **Rules PDF mirrors:** link to hosted rules PDFs (when available) on game Summary and in the in-play game info (i) dialog, via shared `MetaGameLinks`.
- **Feedback:** attach SVG and Markdown (`.md`) files on bug reports, features, and comments (with PNG/JPEG/WebP, `.txt`, and `.json`).
- **In-app notifications:** WebSocket `notification` hint debounces `list_notifications` for the navbar bell; home dashboard refetches notifications in parallel with `me_dashboard` (gap filler).
- **Multi-frame board chrome:** jump to first/last frame buttons (double chevrons) beside step prev/next when a game returns multiple render reps.
- **Playground (Lab):** God vs Live view for games with hidden information — board and status use the current player’s stripped view in Live mode; exploration and saves keep full state.
- **Playground (Lab):** simultaneous games in seat mode — per-seat move entry, round buffer until all active seats submit, eliminated-seat handling, and active-seat picker for board perspective.
- **Move tree exploration:** mark an explored line as an explicit draw (½) or clear an outcome back to undecided (?), alongside player win markers; annotations propagate up the tree like win/loss markers.
- **Teaching mode:** optional cooperative undo on 2-player, non-simultaneous challenges (new challenge and standing challenge modals); grant / keep / undo controls on the move page (all four layouts); during review, only keep/undo are offered; challenge cards show a teaching label.
- **Challenges:** direct teaching challenges from a preset board — issue from Playground/Lab (“Challenge from position”) or the live move tree (“Teach this position”); challengee sees a read-only board preview before accept.
- **Player profile:** Game History table includes game length (move count) after End date.
- **Dashboard:** “Your tournaments” section (after Your games) lists in-progress automated tournaments you are in via `me_dashboard.currentTournaments`; hidden when none.
- **Dashboard:** optional tabbed layout (Games, Tournaments, Challenges; Admin tab for site admins) with vertical/tabbed preference stored locally; Issue challenge always available in tabbed mode.

### Changed

- **CI deps:** `npm run setup-git` registers the `merge.ours` driver (`.gitattributes` alone did not prevent develop↔`main` conflicts); documented GitHub PR merge limitation.
- **Tooling layout:** maintained Node entrypoints moved from `bin/` to `scripts/`; `bin/` is for local scratch (see `bin/README.md`). Lint covers `src/` and `scripts/` only.
- **Challenges:** direct opponent picker always hides legacy embedded AiAi user id; registered bots appear when their `stars` include the selected game (no `aiai` flag gate).
- **Tournaments:** automated tournaments help text reflects 120-hour starting clock (full max bank).
- **Board toolbar:** rotate clockwise/counterclockwise and “back to current position” exploration controls use Unicode arrow glyphs (↳ / ↲ / ↩) instead of Font Awesome icons.
- **Move tree (round grid):** compact/sparse rows and path indexing delegate to gameslib `getMoveTableRounds` / `pathIndexForMoveTableCell` (exploration wire split stays in a thin front adapter).
- **Live play move tree:** mainline moves and exploration branches are styled differently (with a short legend when branches are present).
- **Move tree branches (live play and Lab):** at a multi-branch ply, list all lines (a, b, …) with the active one highlighted; ↑/↓ toolbar buttons and tooltips match keyboard (up = previous variant, down = next).
- **Move list:** hover cursor on move notation is a pointer (clickable moves) while text selection still works.

### Fixed

- **In-game chat:** unsent composer text is kept when switching drawer or overlay tabs (strip, card, and other layouts that unmount chat).
- **Stack-expanding display:** Re-derive `stackExpanding` from game flags and the current render rep on each sync (and when changing display in settings) so switching from 3D to expanding (e.g. Volcano in Lab) enables stack hover again.
- **Customize:** per-game settings JSON and saves include the full `render` block (e.g. `hide-labels-half`) when those options are checked — no longer omitted from the editor blob when they match global defaults.
- **Customize:** preferred player colour no longer remaps the renderer palette on `shared-pieces` games (e.g. Rincala scoring colours).
- **Dashboard:** sorting “Challenged” / opponent columns no longer crashes when a row has no named invitees (e.g. partially filled standing challenges with empty `challengees`).
- **Deploy:** S3 cost-allocation tagging no longer uses serverless-finch `client.tags` (full `putBucketTagging` removed AWS system tags and failed with “System tags cannot be removed by requester”); tags are merged via `bin/apply-s3-cost-allocation-tags.mjs` after upload.
- **Dashboard (opponent’s turn):** time remaining shows the shortest opponent clock for simultaneous games (after you have submitted for the round).
- **Hex move-table integration tests:** use committed `hex-b058` replay fixture instead of live prod `get_game` (CI no longer flakes when that game advances).
- **Teaching mode:** seat swap (pie rule) and the preemptive swap notice are hidden and blocked on teaching games; accepting an undo no longer throws when move-tree exploration is enabled (skip branch merge when the main line shortens after `teaching_undo_move`).
- **Export to Playground:** disabled on live games when exploration is off (metagame `no-explore` flag or in-progress challenge with no exploration), matching move-tree exploration rules.
- **Live simultaneous play:** while waiting for opponents, your own submitted sub-moves stay visible on the board, move list, and event log (e.g. Entropy; requires gameslib with partial-round chat log lines).
- **Board export:** animated GIF dialog on strip/card/narrative layouts (modal mounted in game-move shell); GIF button disabled when no exportable move line; PNG/GIF export uses the last renderrep for multi-board games (e.g. Bao).
- **Game move (finished games):** move scrubbing and board GIF export show full hidden information (e.g. hands) by using omniscient render when the session is over, matching Lab archive behaviour.
- **Live play exploration:** restore `emulation: true` on engine moves during exploration (partial still from UI/sim round); Waldmeister/Frogger snapshot reload fixed in gameslib emulated-complete `saveState()` behaviour.
- **Player profile:** Game History Rematch pre-fills variant rules from the original game using variant UIDs encoded in `site.gameid` (not display names in `header.game.variants`).
- **Live play exploration:** clicks, typed moves, and board render all use one engine built from the hydrated focus node (partials stay in the move string); multi-frame SVG remounts when the focused render changes; exploration premove clock is no longer clipped.
- **Live play multi-frame boards:** render from live main-line `game.state` at move-tree focus (not stale exploration spine snapshots); clear spine caches on API state refresh.
- **Move tree (sequenced games):** compact row density merges seat cycles again when the engine exposes a full stack-aligned `getRounds()` grid (playground and live play); sparse density still uses one row per stack move for path indexing.
- **Playground (Lab):** God vs Live hidden-information controls stay available for card games (e.g. Jacynth, Biscuit) — strip capability is probed on disposable engines so gameslib strip export cannot corrupt the live session engine.
- **Open challenges:** show a spinner while accept is in flight instead of optimistic “Accepted!” before the server responds.
- **Live play move list:** sequential games with multiple exploration/premove lines at the tip no longer show opponent branches in the wrong player column or drop the last played mainline ply (e.g. Hex premove trees); active games use the live path builder instead of the finished-game layout when the tip has branches; opponent branch rows no longer inherit premove for column assignment (clock icon unchanged).
- **i18n CI:** `locale-src/` sidecars are committed again on develop deploy (auto-commit `file_pattern` was multiline, so only `public/locales` were ever staged); backfilled sidecars to stop repeated Gemini rewrites of the same strings.

## [1.0.0-ci] - 2026-09-30

### Added

- **Play-page layouts:** classic, strip (default), queue card, and narrative on unified `/move/` routes; layout picker in the header; first-visit hint on strip; `/move-beta/` redirects to `/move/`. Layout usage analytics (`session_start`, `layout_switch`) with localStorage prefs and on-demand backend export.
- **Feedback:** in-app feedback with feature tagging, drag-and-drop attachments, previews, and richer admin/review views; technical context attached to bug reports.
- **Announcements:** fanout announcements and paginated news loading (alongside RSS).
- Tabbed user settings; option to opt out of direct challenges.
- Combinable display UI for games that support multiple render modes.
- Board customization: swap between registry-group board styles (e.g. hex-of-hex and hex-of-tri); expanded customize options and loosened style eligibility aligned with renderer chrome work.
- Two-leg automated tournaments; UI for game retraction after submission.
- Global search fields on most tables (case-insensitive, trimmed tokens); dashboard table sort preferences persisted locally.
- Player selection dialog; download button for open challenges; enlargeable avatars.
- Sidebar score tables can render rows of inline glyphs.
- Playground: custom CSS, txt/json uploads, Kill-All Go button labels, and related quality-of-life tweaks.
- Esperanto and broader locale work; locale-aware collators for game, player, and designer name columns; natural sort for numeric runs in labels (board sizes, piece counts).
- SEO, sitemap audit, and documentation updates; Serverless Framework 4 migration.

### Changed

- Centralized variant and meta-game list sorting across dashboard, challenges, and explore surfaces.
- Stats charts: line graphs and dark-mode fixes on several panels.
- Cognito/session and presence tweaks (e.g. last-seen with own messages, sidecar locale sync).

### Fixed

- Many regressions tied to new layouts: move entry on strip/dock/card, chat scrolling on narrow screens, move times in some layouts, queue card jumping, clocks and claim-win-on-time, exploration after game over or when exploration was disabled mid-game, random move in live games, move tree stability, AI move handling, board merging on the customize screen, table rerenders after adding search, display selection dialog React warning, public exploration response handling, and assorted navigation/link bugs.

## [1.0.0-ci] - 2026-08-30

### Added

- **Vite** production build (replacing the legacy CRA/webpack toolchain); Node 24 in CI; ESLint in the pipeline; build tag on About.
- **Play-page layouts (beta → production):** strip, narrative, queue card, and classic routes under `/move-beta/` before consolidation in September; deep linking for game lists and player pages; confirm draw offers; challenge button on starred games.
- **Stats redesign:** new site/player surfacing, rivalry opt-in, game recommendation engine in the Lab, random game control; Plotly removed from the bundle.
- **Notifications:** expanded preferences, tournament start/end, rating-change toasts, structured chat API migration, push deduplication fixes.
- **Me / profile refactor** with Glicko display, rating explanations, and completed-games table wired to backend changes.
- Solo game UX pass; solo games filtered out of tournament creation; turn-model and simultaneous-move display updates.
- Structured render labels and sidebars (multi-phase); references and CoL-style side areas in the UI.
- Variant constraint editor (`implies`, `impliesLock`, back-pressure, dynamic flags).
- Externalized locale bundles published to S3; locale sync/publish scripts; large i18n expansion (including Esperanto in the language picker).
- Lab and playground improvements (board exports, rotation fixes, ConHex 90° rotation).

### Changed

- WebSocket efficiency and auth token refresh hardening after the Me refactor.
- Automated tournaments layout; removed legacy “start tournament” admin control from the default UI.
- CloudFront CSP sync script; workflow and invalidation hardening.

### Fixed

- Exploration, Homeworlds, scrollbar, stats race, post-game chat in beta layouts, event games in new layouts, token refresh loops, and numerous beta-layout navigation issues.

## [1.0.0-ci] - 2026-06-30

### Added

- **Theme customizer** (“paintbrush”): global themes, glyph maps, scale, JSON import/export, full-height board toggle, and reset behaviour tied to saved global customization.
- Multi-frame render support in `GameMove`; display options on metagame pages; disable export-to-playground where inappropriate.
- **Bots** (initial Lab feature) and public-key wiring for automated opponents.
- Org events: `maxPlayers`, invites, and blocks.
- Variant constraints groundwork and games-list refactor; random game list; return-to-list navigation after exploring a title.
- Unrated variants; tournament and profile fixes for multi-host games.
- Notes on game landing pages; tournament lists restrictable to starred games.
- Translation sidecars and English reinternalized for guaranteed fallback; Weblate merge workflow improvements.

### Changed

- Player colour preferences centralized; revised customize screen with patterns (phase before August paintbrush work).
- Playground renders last frame by default; expanded variant hooks shared with open-challenge lists.

### Fixed

- Exploration gating when settings undefined; palette race conditions; player search and ratings win-rate display.

## [1.0.0-ci] - 2025-12-31

### Added

- **WebSocket** live updates for games and presence (alongside REST), with idle reconnect and guard against duplicate sockets per tab.
- **Premoves** and autopass; exploration after game end on completed games where allowed.
- Online/offline indicators on dashboard tables and game pages; “hide offline” on the players list; invisible presence support.
- Move-list thumbnails (experimental); service worker tweaks for caching reliability.
- Auth refactor: shared `API_ENDPOINT_AUTH` helper and redirect to login when Cognito refresh tokens expire (~30 days).

### Changed

- Connection status moved from `globalMe` into socket layer.
- Experimental games hidden from production landing pages, designer/coder profiles, and new-challenge flows.

### Fixed

- Premove merge and icon styling; websocket auth token fetch failures; new challenge modal from dashboard; global table filter case handling.

## [1.0.0-ci] - 2025-06-30

### Added

- **Explore** page for discovering games (popularity, player counts, h-index-style metrics, revised time windows).
- Tabular standing challenges and refreshed challenge modals; `/play` shortcut; explore moved under Games.
- RSS (`news.rss`) in the build chain; ongoing news feed updates.
- Response-time and timeout statistics on site stats and player profiles.
- Persistent per-player colours and custom palette picker with default-palette presets.
- Tournament stats on global and profile pages; move comments surfaced in game lists (distinct from variation comments).
- Profile links for coders/designers; game and player links on tournament pages.
- Lazy-loaded game history for large games (with follow-up fixes).

### Changed

- Games table defaults (e.g. `dateAdded` sort); dashboard copy and empty-section cleanup.
- Explore hotness/averages and layout tweaks.

### Fixed

- Churn and related completed-game edge cases; challenge table sorting; username stripping on other users’ profiles.

## [1.0.0-ci] - 2024-12-31

### Added

- **Organized events** with divisions, summaries (GFM), and per-game record downloads.
- Manual and periodic **refresh** on the play page; backend `next_game` for Next Game ordering.
- **90° board rotation** (`rot90`) generalized beyond Homeworlds-only handling.
- Meta-game landing pages with tabs, wiki links, starrers, and richer catalog text; game title above the board links to meta page.
- BGG profile link and editable **About Me**; regional filter on the players list.
- Related sites in the navbar; new-message indicators on dashboard and game page.
- Hard-time clock indicator styling; ply numbers in chat log.

### Changed

- Pie/clock copy and game-controlled pie behaviour; analytics adjustments.
- Full variant names in lists where available.

### Fixed

- Exploration lost on refresh/next-game race (attempted fix and follow-ups); `lastchat` when no active games; alt-display exploration resets.

## [1.0.0-ci] - 2024-06-30

### Added

- **Dark mode** driven by renderer colour contexts; front passes theme colours and redraws boards on toggle.
- **No-explore** mode for live and standing challenges; public exploration rules clarified in copy.
- Tournament waiting states; admin ability to start specific tournaments; tournament error reporting.
- Restored per-game **landing pages**; explore/save rules for anonymous users.
- OpenGraph tags (static baseline in `index.html`); **route-level code splitting** (large main-bundle reduction).
- Markdown in user chat; mobile debounce for numeric move entry; toggleable zoom and vertical layout experiments.
- Weblate translations (French, Norwegian Bokmål, Esperanto, and others); localized table headers groundwork.
- Custom **colour context** and gridline colour in render options; `custom-colors` games refresh palettes aggressively.
- Historical stats blurb on game landing pages; spoilers support on About.

### Changed

- Games and variants sorted per gameslib order; experimental variants filtered from pickers.
- Next-game list sorted by time remaining.

### Fixed

- Removed/archived games handling; tournament pages when players dropped for timeouts; opponent sort on dashboard; simultaneous-game move-tree player links.

## [1.0.0-ci] - 2023-12-31

### Added

- **Production deploy** workflow; experimental games suppressed in production lists and challenges.
- **Exploration** controls (ask/never/always), auto “only move”, merge fixes, partial-move rendering, PNG board export, game-ending feedback while exploring.
- Play screen: info and debug actions, zoom, **Next game**, new-chat indicator, move-entry status colouring, sticky moves header, download game record (interim).
- **Push notifications** and notification settings; standing challenges with counts and tables.
- Dashboard **searchable/sortable tables**; Your Turn / Opponent’s Turn with **time remaining**; completed games table improvements.
- **Stars** and alternate displays; duration limits on standing challenges.
- **Solo playground**; **public exploration** on completed games; player **stats** (histograms, growth charts).
- **Player profiles** with history card, geostats, activity, and Elo rank; player list page; game **tags** and delete; **custom colours** for pieces and boards.
- **News** page; automatic **sitemap** and separate dev/prod `robots.txt`; canonical URL cleanup for SEO.
- Chat UX (auto-expanding input, mobile layout); tutorials; confirm-move flow; many new game board images in the catalog.

### Fixed

- Homeworlds and other click-handler bugs; simultaneous-game move compare; login expiry blank screen; exploration crash on multiple winning tries; profile/challenge flows without completed user id; blank display names and ToS consent.

## [1.0.0-beta] - 2023-04-30

Initial beta launch of Abstract Play! We're happy with the core functionality, but we are looking for concrete feedback on how to make things better. Please be generous with your bug reports and suggestions, and please be patient with the bugs you will almost certainly encounter.
