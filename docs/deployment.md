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
| `npm run build-dev` | Vite build with `VITE_REAL_MODE=development`; copies dev `robots.txt`, strips `build/locales` |
| `npm run build-prod` | Vite build with `VITE_REAL_MODE=production`; generates sitemap; copies prod `robots.txt`, strips `build/locales` |
| `npm run analyze` | Bundle size report via `source-map-explorer` (runs a dev-mode Vite build first — prod builds omit source maps) |
| `npm run analyze:only` | Re-run explorer on an existing dev build in `build/` |
| `npm run deploy` | Upload `build/` to dev S3 bucket |
| `npm run deploy-prod` | Upload `build/` to prod S3 bucket (`--stage prod`) |
| `npm run full-dev` | `build-dev` + deploy + publish locales to dev S3 |
| `npm run full-prod` | `build-prod` + deploy + publish locales to prod S3 |
| `npm run publish-locales` | Upload `public/locales/` (+ gameslib) to dev bucket (`locales/` prefix) |
| `npm run publish-locales:prod` | Same for prod bucket |

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

1. Reject merge conflict markers in `package.json`, `package-lock.json`, and `ci-deps.*.json`.
2. `npm ci` (with GitHub Packages auth).
3. **Test job** (required before deploy): validate manifests → `ap-install-deps --stage dev|prod` → strict lockfile check → `npm run test:ci` and lint.
4. **Deploy job**: same dep order for the stage, then auto-commit `ci-deps.*.json`, `package-lock.json`, and `package.json` on `repository_dispatch` only.
5. `npm run build-dev` or `build-prod`.
6. `serverless client deploy`.
7. Publish locale JSON files to S3 (`bin/publish-locales.mjs`).

Deployments do **not** use CloudFront invalidations. Cache freshness is handled by upload headers (see below) and content-hashed JS/CSS bundle filenames under `build/static/` (Vite `rollupOptions.output`, matching the former CRA layout).

## Cache headers

[`serverless.yml`](../serverless.yml) sets object headers on upload:

- Fingerprinted assets (`static/**`, `flags/**`): `max-age=31536000, immutable`
- `index.html`, `error.html`: `no-cache, no-store, must-revalidate`
- Other objects: `max-age=3600`

Locale files uploaded by `publish-locales.mjs` use `max-age=3600`.

## Content Security Policy

`csp-policy.mjs` is the single source of truth. **Production CSP is enforced by a CloudFront response header**, not an HTML meta tag (duplicate policies are intersected by the browser, so an outdated CloudFront header can block features even after `csp-policy.mjs` changes are deployed to S3).

After editing `csp-policy.mjs`, deploy as usual; CI runs `node bin/sync-cloudfront-csp.mjs --stage dev|prod` after `serverless client deploy`. To sync manually:

```bash
node bin/sync-cloudfront-csp.mjs --stage dev
node bin/sync-cloudfront-csp.mjs --stage prod
```

Use `--dry-run` to print the policy without calling AWS. Local `npm start` has no CSP (Vite HMR).

## SPA routing

The `serverless-single-page-app-plugin` rewrites unknown paths to `index.html` so client-side routing works on refresh.

## Dependencies on other repos

Published `gameslib` and `renderer` packages use immutable `1.0.0-ci-{GITHUB_RUN_ID}` versions. The cascade works like this:

1. **renderer** publishes and dispatches `renderer_version` to **gameslib** and **designer**.
2. **gameslib** installs that renderer, tests, publishes, then dispatches `gameslib_version` + `renderer_version` to front and the backends.
3. Each consumer runs `npm ci`, validates manifests, then `ap-install-deps --stage dev|prod`, which syncs `package.json` and the lockfile from the dispatch payload or `ci-deps.<stage>.json`.

After a merge that touches dependency files, run `npm run sync-deps` on `develop` (or `npm run sync-deps:prod` on `main`) and commit `ci-deps.*.json`, `package-lock.json`, and `package.json` together. Do not hand-merge version strings — regenerate with `sync-deps`.

`ci-deps.prod.json` is protected on `main` via `.gitattributes` (`merge=ours`) so merges from `develop` do not overwrite production pins. `package-lock.json` uses `merge=ours` on the target branch; run `sync-deps` if the strict check fails after a merge.

### Prod API lag

It is normal for a **prod** deploy to fail at build when application code on `main` uses a gameslib API that is not yet in the pinned prod gameslib version. Wait for `dep_update_prod` (or bump `ci-deps.prod.json` deliberately when releasing).

### AP dependency sync

- `npm run sync-deps` — apply `ci-deps.dev.json` to the lockfile.
- `npm run sync-deps:prod` — apply `ci-deps.prod.json` (prod registry checks apply on install).

CI always runs `ap-install-deps` before tests, lint, and build. `ap-check-ci-deps` is not part of `npm run lint`.

## Related

- [Configuration](/front/configuration/)
- [Getting started](/front/getting-started/)
