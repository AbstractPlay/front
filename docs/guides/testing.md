# Testing

## Current state

Two layers:

```bash
npm test              # Jest watch mode (unit tests with mocks)
npm run test:ci       # Jest single-run + real-engine contract tests
npm run test:engines  # Real gameslib contract/integration tests only
```

CI runs `npm run test:ci` on pull requests and pushes to `develop` / `main` (see `.github/workflows/test.yml`). The workflow installs pinned `@abstractplay/gameslib` / `@abstractplay/renderer` from `ci-deps.json`, same as deploy.

### Test layers

| Layer | Location | What it guards |
|-------|----------|----------------|
| Mocked unit tests | `src/lib/GameMove/explorationMoves.test.js` | Edge cases with lightweight engine mocks |
| **Real-engine contracts** | `bin/test-exploration-contracts.mjs` | Partial/persist probe + Submit visibility against actual gameslib |
| Other lib tests | `src/lib/GameMove/exploration.test.js`, `src/lib/Lab/`, etc. | Save/merge, playground payloads |

**Why a Node script for real engines?** Create React App's Jest resolver loads `@abstractplay/gameslib`'s TypeScript sources (and chokes on ESM deps like `js-combinatorics`) instead of the compiled `build/` output. `bin/test-exploration-contracts.mjs` uses the same resolver as production until the Vite migration. It requires **Node 20+** (CRA-style `import` in `.js` files without `"type": "module"`). Jest still has a `moduleNameMapper` pointing at `build/` for future component tests.

### Fixtures

Regression scenarios live under `src/lib/GameMove/fixtures/`. Each fixture is **inline JSON** (never read from `bin/` or external files at runtime).

To add a new regression case when you find a play-page bug:

1. Add state + move(s) in a file under `fixtures/` (or extend an existing game file).
2. Export a contract object:

```javascript
{
  id: "my-game-scenario",       // unique, used in test output
  metaGame: "mygame",
  state: JSON.stringify({...}), // or null for a fresh GameFactory(game)
  move: "the-move-string",
  whileEditing: { partial: true, persistable: false },
  afterComplete: { partial: false, persistable: true },
  submitAfterComplete: true,    // enables integration assertions in test:engines
}
```

3. Append to `EXPLORATION_CONTRACTS` in `src/lib/GameMove/fixtures/index.js`.

The engine runner in `bin/` picks up new contracts automatically.

### Shared helpers

- `src/lib/GameMove/submitMove.js` — `getPendingSubmitMove()` (used by `MoveEntry` and engine tests)

### Jest config

CRA overrides live in `config/jest/babelTransform.js` and `config/jest/fileTransform.js`. `src/setupTests.js` is reserved for future global setup.

Package.json `jest` section maps `@abstractplay/gameslib` to the compiled build (for tests that do not mock the package).

## Adding component tests

1. Colocate tests as `Component.test.js` next to the component, or under `src/pages/` for page shells.
2. Import from `@testing-library/react` and `@testing-library/user-event`.
3. Mock heavy dependencies:
   - `aws-amplify` / `Auth` for auth flows
   - `fetch` for API calls
   - `@abstractplay/gameslib` / `@abstractplay/renderer` for game components (when not using `test:engines`)

## What to prioritize next

High-value targets if expanding coverage:

- `src/lib/api.js` (`callAuthApi`) — token missing, 401 redirect
- `src/components/Bots/botApi.js` — response envelope parsing
- Route smoke tests for critical pages

## Linting

ESLint config: [`.eslintrc.json`](../.eslintrc.json) (`eslint:recommended`, `react-app`, `react-hooks`).

```bash
npm run lint       # report issues in src/ and bin/
npm run lint:fix   # auto-fix where ESLint can
npm run format     # Prettier on src/**/*.{js,jsx}
```

CI runs `npm run lint` after tests (see [`.github/workflows/test.yml`](../../.github/workflows/test.yml)). Lint fails on **errors** only; hook-deps and a11y findings are warnings for now.

## Related

- [Getting started](/front/getting-started/)
- [Architecture](/front/architecture/)
