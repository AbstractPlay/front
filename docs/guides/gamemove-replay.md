# Game Move session replay (local only)

Contributor tooling to open the real `/move` play page against a **frozen API snapshot** and a chosen **seat perspective**, without logging in as that player. Mutations are disabled.

## Requirements

- `npm start` (`VITE_REAL_MODE=local` — not deployed dev/prod builds)
- Optional: `.env.local` with `AP_TEST_USER` / `AP_TEST_PASSWORD` to capture fresh bundles from prod/dev

## Capture a bundle

From the front repo root:

```bash
node bin/capture-gamemove-replay.mjs \
  --slug my-case \
  --game-id <uuid> \
  --meta-game hex \
  --cbits 0 \
  --view-as <player-uuid-from-game.players> \
  --stage prod
```

This writes `src/lib/GameMove/fixtures/replays/<slug>.json` unless `--out` is set.

Register new slugs in [`src/lib/GameMove/fixtures/replays/registry.js`](../../src/lib/GameMove/fixtures/replays/registry.js).

## Open in the browser

```text
/move/<metaGame>/<cbits>/<gameID>?replay=<slug>&layout=strip
```

Optional: `&viewAs=<playerUuid>` overrides the bundle default seat.

Example (committed regression case):

```text
/move/hex/0/8a8e2d42-a0ae-4366-834d-fc476f52adca?replay=hex-b058&layout=strip
```

## Tests

[`src/lib/GameMove/gamemoveReplayBundle.test.js`](../../src/lib/GameMove/gamemoveReplayBundle.test.js) imports the committed JSON and asserts move-table seat behaviour.

## Deploy safety

Replay code is stripped from production bundles:

- Vite aliases [`shimEntry.js`](../../src/lib/GameMove/replay/shimEntry.js) to a no-op stub on `vite build`
- `scripts/check-no-gamemove-replay-in-build.mjs` runs after `build-dev` and `build-prod`

## Related

- [Game move](/front/subsystems/game-move/)
- [Testing](/front/guides/testing/)
