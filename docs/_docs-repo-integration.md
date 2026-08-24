# Docs repository integration

Integration with the [AbstractPlay/docs](https://github.com/AbstractPlay/docs) repository:

- Submodule: `vendor/front` → `https://github.com/AbstractPlay/front.git` (`develop` / `main`)
- Prebuild: `syncDocs("front", "front", false)`
- Site nav: **Front** section at `/front/`
- Deploy workflows fetch `vendor/front` with other vendor submodules

Local prebuild falls back to a sibling `../front` checkout when the submodule does not yet contain `/docs` (e.g. before docs land on `develop`).

Published URL prefix: `/front/` (e.g. `/front/getting-started/`).

## Link rules (docs:check)

`npm run docs:check` in this repo validates **front docs only**:

- `docs/nav.json` entries match published pages under `/front/`
- Internal `/front/…` links resolve to those pages
- Cross-repo links (`/backend/`, `/crons/`, `/gameslib/`, etc.) are **not** checked here

Relative links resolve against the **published page URL**, not the file path on disk.

- **Cross-page doc links:** use absolute URLs (`/front/deployment/`, `/backend/getting-started/`).
- **Source under `src/`, `public/`, `config/`, `.github/`:** relative paths are OK (e.g. [`../src/lib/api.js`](../src/lib/api.js)).
- **Repo-root files** (`csp-policy.mjs`, `vite.config.js`, `bin/…`): use inline `` `backticks` `` or a GitHub URL — not `[text](../file.mjs)`.

From this repo:

```bash
npm run docs:check
```

The [AbstractPlay/docs](https://github.com/AbstractPlay/docs) repo runs the full multi-vendor check before publish. New pages must be listed in [`docs/nav.json`](nav.json).
