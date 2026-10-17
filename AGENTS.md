# Agent guide — front (apfront)

Official Abstract Play browser client: Vite, React 18, Zustand. Depends on `@abstractplay/gameslib` and `@abstractplay/renderer`. Human docs: [docs.abstractplay.com/front/](https://docs.abstractplay.com/front/).

## Abstract Play (wide)

Follow the canonical org-wide policy in [gameslib `AGENTS.md` — Abstract Play (wide)](https://github.com/AbstractPlay/gameslib/blob/develop/AGENTS.md#abstract-play-wide) (scope, handoff gates, dependencies, changelog, i18n, docs, secrets, AI commit rules).

## Layout

| Path | Purpose |
|------|---------|
| `src/pages/` | Route shells (`Skeleton.js` app root) |
| `src/components/` | Feature UI (`GameMove/`, `Tournaments/`, `Lab/`, …) |
| `src/lib/` | Shared non-UI logic (API, game-move, exploration) |
| `src/stores/` | Zustand |
| `src/config/` | Cognito/API endpoints (`VITE_REAL_MODE`) |
| `scripts/` | Build, locales, sitemap, exploration contract runner (`package.json` entrypoints) |
| `bin/` | Local scratch, exports, and one-off dev helpers (gitignored output under `bin/out/`) |
| `public/locales/` | Locale JSON (HTTP + sync source) |
| `docs/` | Contributor docs |

**`lib/` vs `components/`:** pure helpers and no JSX → `lib/`; React UI → `components/`. See [docs/guides/project-structure.md](docs/guides/project-structure.md).

## Commands

| Command | When |
|---------|------|
| `npm test` | Vitest unit tests (fast) |
| `npm run test:ci` | Vitest + real gameslib contracts (`test:engines`) — CI |
| `npm run test:engines` | `scripts/test-exploration-contracts.mjs` only |
| `npm run lint` | Locale JSON format + ESLint (`src/`, `scripts/`) |
| `npm run sync-locales` | Before `start` / build — copies gameslib namespaces + bundles English |

`package.json` has no separate `typecheck` script; CI tests run via Vitest. For a TS-free repo, **lint + test:ci** match deploy prerequisites.

Pinned AP package versions: [`ci-deps.dev.json`](ci-deps.dev.json) / prod sibling; `npm run sync-deps` updates lockfile to pins.

## Testing

Two layers (detail: [docs/guides/testing.md](docs/guides/testing.md)):

1. **Vitest** — mocked units under `src/` (`jsdom`, Testing Library). `@abstractplay/gameslib` resolves to compiled **`build/`** via [`vite.config.js`](vite.config.js).
2. **Real engines** — `npm run test:engines` loads gameslib like production. Vitest alone does not catch Lambda-style CommonJS init issues; backend `lambdaInit` and gameslib postbuild cover other angles.

**Fixtures:** regression scenarios under `src/lib/GameMove/fixtures/` as **inline JSON** — register in `fixtures/index.js`. Do not read `bin/` scratch paths or other external files at test runtime (same rule as gameslib).

Play-page bugs: add a contract object (`metaGame`, `state`, `move`, expected partial/persist flags) and append to `EXPLORATION_CONTRACTS` in the fixtures index.

## Internationalization

- Author UI copy in **`public/locales/en/apfront.json`** only.
- `apgames` / `apresults` English are synced from gameslib via `sync-locales`; do not edit non-English under `public/locales/`.
- Plural keys: `_one` / `_other`, not `piece(s)`.
- [docs/subsystems/i18n.md](docs/subsystems/i18n.md).

## Documentation

New `docs/**/*.md` page → [`docs/nav.json`](docs/nav.json). Run `npm run docs:check` for front-local nav and links.

## Changelog

Substantive user- or integrator-visible changes → root [`CHANGELOG.md`](CHANGELOG.md).

**One section per calendar month** — not one per ship day or PR:

1. Before editing, search `CHANGELOG.md` for `- YYYY-MM-` using today’s year and month (e.g. `2026-10-`).
2. If a `## [1.0.0-ci] - …` header already exists for that month, append under the right `### Added` / `### Changed` / `### Fixed` and update **only that header’s date** to today (`YYYY-MM-DD`).
3. If none exists for that month, add a new `## [1.0.0-ci] - YYYY-MM-DD` section below the `CHANGELOG.md` intro, above older months.

Do **not** add a second October (or same-month) `##` block when one is already present. Detail: [`CHANGELOG.md`](CHANGELOG.md) intro (monthly batching).

## Contact

[#dev-curious on Discord](https://discord.abstractplay.com)
