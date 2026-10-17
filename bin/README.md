# `bin/` — local scratch

Not linted in CI. Use for personal exports, captured API payloads, and one-off helpers.

- **`out/`** — gitignored build/export artifacts (playground JSON, prod bundles, etc.).
- **`requests/`** — saved auth POST bodies for manual `ap-auth-post.mjs` runs.
- **`fixtures/`** — optional snapshots written by integration tests when env flags are set.
- **`translate-debug/`** — gitignored translate diagnostics.

Maintained repo tooling lives in [`scripts/`](../scripts/) and is wired through `package.json`.
