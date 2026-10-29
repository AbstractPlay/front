# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Since the `1.0.0-beta` release, the version in `package.json` has stayed at `1.0.0-beta`. Production and dev deploys stamp `1.0.0-ci-<GitHub Actions run id>.0` during the workflow (see `.github/workflows/deploy-prod.js.yml` and `deploy-dev.js.yml`). Entries below are grouped by theme and approximate ship window on **main** (what runs at abstractplay.com); they are not a per-commit log.

**Monthly batching (agents):** Use **one** `## [1.0.0-ci] - YYYY-MM-DD` header per calendar month. Before editing, search this file for `- YYYY-MM-` (today’s year-month); if a section exists, append bullets under `### Added` / `### Changed` / `### Fixed` there and set that header’s date to today — do **not** add a second `##` for the same month. A new ship day is not a new section.

## [1.0.0-ci] - 2026-10-29

### Added

- **Realtime Arena (front):** `/arena` landing (table list poll, create open/closed table), table lobby (ready, seat swap, kibitz chat), `/arena/play` and `/arena/watch` shells with `submit_arena_move` and live Fischer clocks; post-game feedback modal (`submit_arena_feedback`); **Arena visible on prod** (removed `VITE_ARENA_UI_DISABLED`).
- **Continuous Delta Ladder:** Ladder list and hub UI (`/ladders`, `/ladder/:id`), dashboard Ladders tab (join match pool per ladder when eligible), game-list Event column, profile ladder module, `watchLadders` WebSocket refresh, in-app notification copy/prefs (`ladderChat`, `ladderDecay`, `ladderPointsGain` / `ladderPointsLoss`, `ladderJoin`, `ladderLeave`); ladder surfaces visible in prod (kill-switch removed).

### Changed

- **Arena play:** game title parenthetical links to **`/arena`** (not the table lobby row); chat stays on the play page **`GAMECOMMENTS`** thread.
- **Arena play:** after game over, queue / next-game controls return to **`/arena`** instead of the correspondence dashboard.
- **Arena landing:** variant picker (`GameVariants`) when creating a table; variants are sent to `create_arena_table` and shown in the open-tables list.
- **Arena landing:** **Create closed table** with player picker (`inviteUserId`); closed rows show an invite-only badge; lobby hides **Take a seat** except for the invitee (spectators can still watch and kibitz).
- **Arena table lobby:** choose play-page layout before ready-up (name + short description; separate `gameMoveLayoutLive` storage). Launch navigates to `/arena/play/...?layout=…`.
- **Play layouts:** fifth **live** layout (clock-first bar, move dock, drawer) for arena and correspondence; arena play/watch default to **live** via `gameMoveLayoutLive`; in-game layout picker links stay on `/arena/play` or `/arena/watch` routes.
- **Tournaments / ladders:** rules intro on the tournaments list, ladder list, and ladder hub keeps the full description in place with a fade and expand/collapse toggle (same pattern as the player profile about box), instead of swapping short and long copy.
- **Ladder list:** paginated ladder table with the shared TanStack table nav (search, page controls, page size).

### Fixed

- **Arena landing:** seated players in a live game get **Return to game** (play URL) instead of only **Watch**; banner when you have an active table.
- **Arena play:** moves use `submit_arena_move` when the loaded game is `playMode: arena` (including after opening via `/move/…`); auto-redirect to `/arena/play/…`; layout switcher links use correct arena paths without a stray `cbits` segment.
- **Arena clocks:** arena end-of-game uses server EventBridge timeloss only (no client `timeloss` polling); play page refreshes on WebSocket `game` updates. **Claim win on time** is hidden. Correspondence hard-clock games still use participant/spectator `timeloss` hints.
- **Arena clocks:** rare client `timeloss` backup only after ~3s display overtime (every 5s) if the scheduler missed; backend re-arms overdue one-shot schedules in the near future instead of past `at()` times.
- **Arena play:** completed games refresh on the board after timeloss (WebSocket `game` broadcast from backend; clock-only `get_game` sync no longer keeps `gameOver: false`).
- **Arena start sync:** Fischer clocks stay frozen until `arenaClockStartAt` is applied; `arena_sync` / `arena_play_ready` update `lastMoveTime` with the server; poll `get_game` and re-call `arena_play_ready` if the WebSocket sync is missed so both clients share the same countdown and clock. Start overlay uses a dedicated tick and a ref so a missed React state update cannot leave “waiting for opponent” up after the other side’s countdown. **Server clock offset** (`serverTime` / `clockDisplayServerTime`) aligns countdown, overlay dismissal, and Fischer display across browsers.
- **Arena clocks:** after the first moves, active-player Fischer display stays aligned when one client applies `submit_arena_move` and the other refreshes via `get_game` (backend display seeds use move `lastMoveTime`, not game start).
- **Arena timeloss:** seated players poll `timeloss(check)` ~750ms after display passes zero (server grace) every 3s when the scheduler is slow; fixes games stuck at negative clocks until a late refresh.
- **Arena clocks:** single Fischer display model on play pages (`player.time` + `lastMoveTime` + one server offset); no correspondence display seeds; fix double server-offset on tick; start overlay no longer re-runs mid-game.
- **Arena start:** WebSocket `arena_launch` redirects both players to play; synchronized 3s countdown after both clients send `arena_play_ready` (Fischer clock starts at `arenaClockStartAt`, not at ready-up).
- **Play (Classic layout):** narrow viewports no longer squeeze the move list and chat into a ~15vw column when orientation or mobile browser chrome leaves a stale wide `innerWidth`; sidebar width is CSS-gated at Bulma’s tablet breakpoint and viewport width tracks `visualViewport`, `orientationchange`, and `matchMedia`.

### Removed

- **Arena quick match:** `join_arena_queue` / `leave_arena_queue` UI and copy; matchmaking is create-or-join open tables only.

## [1.0.0-ci] - 2026-10-25

### Changed

- **Site theme:** Customize Site Theme is a full page at `/customize/site-theme` (profile menu) with a large live preview of every tunable colour token; the navbar modal was removed.
- **Play / Lab:** move-tree replay controls are grouped (step vs jump-to-start/end) with a fixed prev/next bar on narrow screens to reduce mis-taps on mobile.
- **Play:** mobile move-tree prev/next bar stays available for the whole game page (not only when the move list panel is open).
- **Play:** move entry validates 500 ms after typing pauses (same delay on all devices and characters).
- **Navigation:** Community menu lists **Feedback history** above **My feedback** (with a divider when signed in); About menu links to the wiki instead of feedback history.

### Added

- **Playground:** game landing pages link **Launch in Playground**; `/playground?metaGame=` opens the launcher with that game selected or starts immediately when no player count or variant setup is required.
- **Play / Playground:** optional multi-line move entry (device-local preference) with **Update move** to apply text; stash clicks append to the current draft. Playground (`/playground`) matches live play.
- **Tournaments:** **All** tab on `/tournaments` shows archived tournament history when a single game is selected (`/tournaments/all/:metaGame`, including the game-page tournaments embed).
- **Dashboard:** when you are on vacation (or have vacation scheduled), the same info banner as on your player profile appears at the top of the dashboard.

### Fixed

- **Live play premoves:** `submit_move` again passes the opponent’s user id so the server can load their exploration tree and auto-play premoves (regression from move-submit serialization).
- **Deploy / long-lived tabs:** lazy route chunks that fail after a new release trigger one automatic full-page reload before showing the fatal error screen.
- **Teaching mode:** confirmation before **Offer undo** to reduce misclicks.
- **Tournaments:** tournament detail page handles missing API data without crashing (404, load error, registration phase without divisions).
- **Tournaments:** game-page tournament links and URL cleanup no longer redirect in-progress events to `/tournament/{metaGame}/{id}` (which implied archived-only API lookup).
- **Tournaments:** completed/history links and tournament-end notifications use `/tournament/{metaGame}/{id}` so archived events need no expensive id-only API fallback; stop canonical redirects that stripped `metaGame` from URLs.

### Added

- **Game landing page:** Summary tab shows the date the game was added to the site (from gameslib `dateAdded`).
- **Composite board rendering:** Game Move and Lab call `renderComposite` when `render()` returns `kind: "composite"`; `panelId` on board clicks; stacking-expanding hover uses `renderColumn(col, row, panelId?)` for the side stack.
- **Event log:** ply numbers link to that position on the board and move tree.
- **Tournaments:** tournament chat on `/tournament/{id}` (Markdown, participant/admin post); `watchTournaments` WebSocket refresh; in-app `tournamentChat` notification preference and bell copy.
- **Ops:** `ap:service` and `ap:stage` cost-allocation tags on the `apfront` Serverless stack, play S3 buckets (via `serverless client deploy`), and CloudFront distributions (via CSP sync).
- **Bots:** edit bot screen lists supported games and variant combinations; add or remove entries and save via `update_bot`.
- **Rules PDF mirrors:** link to hosted rules PDFs (when available) on game Summary and in the in-play game info (i) dialog, via shared `MetaGameLinks`.
- **Feedback:** attach SVG and Markdown (`.md`) files on bug reports, features, and comments (with PNG/JPEG/WebP, `.txt`, and `.json`).
- **Wishlist:** **Download current view** on `/wishlist` exports JSON matching the filtered, sorted, searched list (no public snapshot URL).
- **In-app notifications:** WebSocket `notification` hint debounces `list_notifications` for the navbar bell; home dashboard refetches notifications in parallel with `me_dashboard` (gap filler).
- **Multi-frame board chrome:** jump to first/last frame buttons (double chevrons) beside step prev/next when a game returns multiple render reps.
- **Playground (Lab):** God vs Live view for games with hidden information — board and status use the current player’s stripped view in Live mode; exploration and saves keep full state.
- **Playground (Lab):** simultaneous games in seat mode — per-seat move entry, round buffer until all active seats submit, eliminated-seat handling, and active-seat picker for board perspective.
- **Move tree exploration:** mark an explored line as an explicit draw (½) or clear an outcome back to undecided (?), alongside player win markers; annotations propagate up the tree like win/loss markers.
- **Teaching mode:** optional cooperative undo on 2-player, non-simultaneous challenges (new challenge and standing challenge modals); grant / keep / undo controls on the move page (all four layouts); during review, only keep/undo are offered; challenge cards show a teaching label.
- **Challenges:** direct teaching challenges from a preset board — issue from Playground/Lab (“Challenge from position”) or the live move tree (“Teach this position”); challengee sees a read-only board preview before accept. Open (standing) 2-player position challenges: issue Open vs Closed from position handoff (default Closed); open-challenges list shows preset badge and accept confirmation modal with board preview.
- **Player profile:** Game History table includes game length (move count) after End date.
- **Dashboard:** “Your tournaments” section (after Your games) lists in-progress automated tournaments you are in via `me_dashboard.currentTournaments`; hidden when none.
- **Dashboard:** optional tabbed layout (Games, Tournaments, Challenges; Admin tab for site admins) with vertical/tabbed preference stored locally; Issue challenge always available in tabbed mode.
- **Playground (Lab):** import checkpoint when opening from a live game or full Playground JSON export — reset to that snapshot after exploring; **Clear game** restarts the move tree with the same game and variants; session actions reorganized (challenge de-emphasized below primary actions).
- **Notifications:** navbar bell panel category filter (chips or dropdown) when the queue includes multiple notification types.

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
- **Strip layout:** status drawer and move dock start expanded on narrow viewports (same as wide); dock collapse toggle remains on small screens.
- **Automated tournaments:** game filter on `/tournaments/` uses the shared game picker (search, categories, quick picks) with an always-visible **All games** control and the same option inside the picker.

### Fixed

- **Live play:** serialize `submit_move`, debounce move-confirm modal submit, and refetch before surfacing move-number mismatch when the server already recorded the ply (duplicate submit).
- **Guerrilla Checkers (match):** finished and in-progress match games load again after game 1 (move list / game record no longer throw on missing `lastmove` on the G2 reset checkpoint; requires gameslib + API hydrate with stack repair).
- **Challenges:** `new_challenge` failures from Lab, live teach-from-position, and challenge modals surface the server message instead of closing silently; position-locked variant uids are sent on issue; open-challenges page refreshes after issuing from that screen.
- **Challenges:** Open vs Closed type on issue-from-position modal is selectable again (removed mistaken `readOnly` on radios — Open was not actually issuable); game page challenges tab passes `metaGame` explicitly; public list fetch parses proxy envelopes instead of failing silently to an empty table.
- **Challenges:** open (standing) issue sends an empty `challengees` list instead of `[""]` placeholder slots.
- **Challenges:** issue-from-player-profile, game-info page, and hub ratings table return `submitNewChallenge` results so the modal no longer shows a false “Error!” after a successful send.
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
- **Alfred's Wyke:** move cooldown colours on the button bar no longer depend on site dark-mode CSS (player-tinted fills from gameslib); selected move type is highlighted while placing cells.
- **Player profile:** Game History Rematch pre-fills variant rules from the original game using variant UIDs encoded in `site.gameid` (not display names in `header.game.variants`).
- **Live play exploration:** clicks, typed moves, and board render all use one engine built from the hydrated focus node (partials stay in the move string); multi-frame SVG remounts when the focused render changes; exploration premove clock is no longer clipped.
- **Live play multi-frame boards:** render from live main-line `game.state` at move-tree focus (not stale exploration spine snapshots); clear spine caches on API state refresh.
- **Move tree (sequenced games):** compact row density merges seat cycles again when the engine exposes a full stack-aligned `getRounds()` grid (playground and live play); sparse density still uses one row per stack move for path indexing.
- **Playground (Lab):** God vs Live hidden-information controls stay available for card games (e.g. Jacynth, Biscuit) — strip capability is probed on disposable engines so gameslib strip export cannot corrupt the live session engine.
- **Playground (Lab):** move tree updates when exploring variations from a rewound position (restore full-tree path layout off the idle mainline tip); branch plies show a/b variation lists and the exploration legend (Lab-only path helpers in `lib/Lab/`; live play move tree unchanged).
- **Open challenges:** show a spinner while accept is in flight instead of optimistic “Accepted!” before the server responds.
- **Live play move list:** sequential games with multiple exploration/premove lines at the tip no longer show opponent branches in the wrong player column or drop the last played mainline ply (e.g. Hex premove trees); active games use the live path builder instead of the finished-game layout when the tip has branches; opponent branch rows no longer inherit premove for column assignment (clock icon unchanged).
- **i18n CI:** `locale-src/` sidecars are committed again on develop deploy (auto-commit `file_pattern` was multiline, so only `public/locales` were ever staged); backfilled sidecars to stop repeated Gemini rewrites of the same strings.
- **Theming:** Bulma `.content` and `.title` heading colours (Markdown, legal copy, game summaries, news, tournaments, events, stats, chat, Lab, and feedback) follow AP `color-mode` instead of `prefers-color-scheme`, so headings stay readable when site light/dark disagrees with the OS.

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
