# `bin/` — local scratch

Not linted in CI. Use for personal exports, captured API payloads, and one-off helpers.

- **`out/`** — gitignored build/export artifacts (playground JSON, prod bundles, etc.).
- **`requests/`** — saved auth POST bodies for manual `ap-auth-post.mjs` runs.
- **`fixtures/`** — optional snapshots written by integration tests when env flags are set.
- **`translate-debug/`** — gitignored translate diagnostics.

Maintained repo tooling lives in [`scripts/`](../scripts/) and is wired through `package.json`.

### Chrome Performance traces (game-move profiling)

Export a trace from DevTools (Performance → Save profile). Decompress `.json.gz` if needed. Put large traces and downloaded `.js.map` files under **`out/`** (gitignored).

```bash
node --max-old-space-size=8192 bin/analyze-chrome-trace.mjs out/Trace-….json

# Download the main chunk source map from the same deploy as the recording, then:
node --max-old-space-size=8192 bin/symbolicate-chrome-trace.mjs aggregate out/Trace-….json out/index-….js.map
node --max-old-space-size=8192 bin/symbolicate-chrome-trace.mjs buckets out/Trace-….json out/index-….js.map

node bin/symbolicate-chrome-trace.mjs position out/index-….js.map 860 63444
```

Shared helpers: [`chrome-trace-utils.mjs`](chrome-trace-utils.mjs).

### In-browser span timing (`apPerf`)

On a **local** dev build (or after deploy), enable move-path timings:

```js
localStorage.setItem("apPerf", "1"); // reload
```

Pick a move from the dropdown or board; the console logs `[apPerf]` spans. Summary table:

```js
apPerfReport();
```

Spans: `explore.handleMove.*`, `explore.doView.*`, `explore.boardSvgLayers`, `explore.boardEffect`, `explore.saveExploration.*`. Compare which line dominates on Exxit vs Amazons.
