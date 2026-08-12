# Deployment

The front end is a static SPA deployed to S3 and served through CloudFront using the Serverless Framework and `serverless-finch`.

## Stages

| Stage | URL | S3 bucket | Branch / trigger |
|-------|-----|-----------|-------------------|
| `dev` | [play.dev.abstractplay.com](https://play.dev.abstractplay.com) | `abstract-play-dev` | `develop` push |
| `prod` | [play.abstractplay.com](https://play.abstractplay.com) | `abstract-play-prod` | `main` push |

Defined in [`serverless.yml`](../serverless.yml).

## Build commands

| Command | Effect |
|---------|--------|
| `npm run build-dev` | Production build with `REACT_APP_REAL_MODE=development` |
| `npm run build-prod` | Production build with `REACT_APP_REAL_MODE=production`; generates sitemap |
| `npm run deploy` | Upload `build/` to dev S3 bucket |
| `npm run deploy-prod` | Upload `build/` to prod S3 bucket (`--stage prod`) |
| `npm run full-dev` | `build-dev` + deploy |
| `npm run full-prod` | `build-prod` + deploy |

## AWS setup

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Configure profiles `AbstractPlayDev` and `AbstractPlayProd` in `~/.aws/credentials`.
3. Install Serverless globally: `npm install -g serverless`.
4. First-time stack setup: `serverless deploy` (dev) and `serverless --stage prod deploy` (prod) to create S3 buckets and CloudFront distributions.

## CI/CD

GitHub Actions workflows:

- [`.github/workflows/deploy-dev.js.yml`](../.github/workflows/deploy-dev.js.yml) — push to `develop`
- [`.github/workflows/deploy-prod.js.yml`](../.github/workflows/deploy-prod.js.yml) — push to `main`

CI steps:

1. Install Serverless and run `npm ci` (with GitHub Packages auth).
2. **Test job** (required before deploy): `bin/install-ap-deps.mjs --for-tests` installs `@abstractplay/gameslib` (full registry) plus pinned renderer, then runs `npm run test:ci` and lint.
3. **Deploy job**: `bin/install-ap-deps.mjs` installs the pinned **production** gameslib and renderer from `ci-deps.json` (or dispatch payload).
4. Auto-commit `ci-deps.json`, `package-lock.json`, and synced `package.json` AP version fields when they change (dispatch only).
5. `npm run build-dev` or `build-prod`.
6. `serverless client deploy`.
7. Publish locale JSON files to S3 (`bin/publish-locales.mjs`).

Deployments do **not** use CloudFront invalidations. Cache freshness is handled by upload headers (see below) and content-hashed JS/CSS bundle filenames from Create React App.

## Cache headers

[`serverless.yml`](../serverless.yml) sets object headers on upload:

- Fingerprinted assets (`static/**`, `flags/**`): `max-age=31536000, immutable`
- `index.html`, `error.html`: `no-cache, no-store, must-revalidate`
- Other objects: `max-age=3600`

Locale files uploaded by `publish-locales.mjs` use `max-age=3600`.

## SPA routing

The `serverless-single-page-app-plugin` rewrites unknown paths to `index.html` so client-side routing works on refresh.

## Dependencies on other repos

Published `gameslib` and `renderer` packages use immutable `1.0.0-ci-{GITHUB_RUN_ID}` versions. The cascade works like this:

1. **renderer** publishes and dispatches `renderer_version` to **gameslib** and **designer**.
2. **gameslib** installs that renderer, tests, publishes, then dispatches `gameslib_version` + `renderer_version` to front and the backends.
3. Each consumer runs `npm ci`, then `bin/install-ap-deps.mjs`, which installs the exact versions from the dispatch payload (or falls back to [`ci-deps.json`](../ci-deps.json) on consumer-only pushes).

You do not need to manually bump AP dependency versions in `package.json` after a gameslib or renderer publish — CI updates `ci-deps.json` and the lockfile automatically.

### Test vs deploy gameslib

Engine contract tests (`test:engines`) need the full gameslib registry (including experimental games). The CI test job installs `@abstractplay/gameslib@development` via `install-ap-deps.mjs --for-tests` without changing the pinned production version in `ci-deps.json`. Deploy builds use the production gameslib artifact from `ci-deps.json`, which matches what production users receive.

A future improvement: gameslib CI could publish a paired dev-registry version (same run ID) into `ci-deps.json` to avoid `@development` tag drift.

## Related

- [Configuration](/front/configuration/)
- [Getting started](/front/getting-started/)
