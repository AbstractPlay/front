# Deployment

The front end is a static SPA deployed to S3 and served through CloudFront. Infrastructure (bucket, distribution, SPA routing) is defined in the Serverless stack; **routine releases** upload `build/` with `scripts/deploy-static.mjs` (no bucket wipe, `index.html` last).

## Stages

| Stage | URL | S3 bucket | Branch / trigger |
|-------|-----|-----------|-------------------|
| `dev` | [play.dev.abstractplay.com](https://play.dev.abstractplay.com) | `abstract-play-dev` | `develop` push |
| `prod` | [play.abstractplay.com](https://play.abstractplay.com) | `abstract-play-prod` | `main` push |

Defined in [`serverless.yml`](../serverless.yml).

Billable AWS resources for the play site use `ap:service=apfront` and `ap:stage` (`dev` / `prod`) for Cost Explorer. Activate those keys once per account under **Billing → Cost allocation tags**. S3 bucket tags are merged (not replaced) by `scripts/apply-s3-cost-allocation-tags.mjs` after each static deploy so existing AWS system tags are preserved. CloudFront distribution tags are applied by `scripts/sync-cloudfront-csp.mjs`.

## Build commands

| Command | Effect |
|---------|--------|
| `npm run build-dev` | Vite build with `VITE_REAL_MODE=development`; copies dev `robots.txt`, strips `build/locales` |
| `npm run build-prod` | Vite build with `VITE_REAL_MODE=production`; generates sitemap; copies prod `robots.txt`, strips `build/locales` |
| `npm run analyze` | Bundle size report via `source-map-explorer` (runs a dev-mode Vite build first — prod builds omit source maps) |
| `npm run analyze:only` | Re-run explorer on an existing dev build in `build/` |
| `npm run deploy` | Upload `build/` to dev S3 (`deploy-static.mjs`: no delete, shell HTML last) |
| `npm run deploy-prod` | Same for prod bucket |
| `npm run full-dev` | `build-dev` + deploy + publish locales to dev S3 |
| `npm run full-prod` | `build-prod` + deploy + publish locales to prod S3 |
| `npm run publish-locales` | Upload `public/locales/` (+ gameslib) to dev bucket (`locales/` prefix) |
| `npm run publish-locales:prod` | Same for prod bucket |

## AWS setup

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Configure profiles `AbstractPlayDev` and `AbstractPlayProd` in `~/.aws/credentials`.
3. Install Serverless locally via `npm ci` in each repo (`serverless@4.42.0` in `devDependencies`). Dashboard auth: `npx serverless login` once (org **abstractplay**), or use org access key in CI.
4. First-time stack setup: `npx serverless deploy` (dev) and `npx serverless --stage prod deploy` (prod) to create S3 buckets and CloudFront distributions.

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
6. **`node scripts/deploy-static.mjs --stage dev|prod`** — then **`node scripts/prune-stale-static.mjs`** (orphaned hashes only; see below).
7. Apply S3 cost tags, sync CloudFront CSP, publish locale JSON (`publish-locales.mjs`).

Deployments do **not** use CloudFront invalidations. Cache freshness is handled by upload headers (see below) and content-hashed JS/CSS bundle filenames under `build/static/` (Vite `rollupOptions.output`, matching the former CRA layout).

### Static upload order (live play / deploy window)

1. **`static/`** and **`flags/`** — `Cache-Control: immutable` (old hashes stay in the bucket for tabs on a previous release).
2. **Other root assets** (favicons, `robots.txt`, …) — one-hour cache; `index.html` / `error.html` excluded.
3. **`error.html`**, then **`index.html`** — `no-cache`, so a new shell never points at JS that is not uploaded yet.

The legacy **`serverless client deploy`** (`serverless-finch`) path is no longer used in CI. It **emptied** the bucket by default and could serve [`error.html`](../public/error.html) during upload. Finch remains in `devDependencies` only if you need a one-off bucket website config upload; infra creation is still `npx serverless deploy`.

[`error.html`](../public/error.html) auto-retries with backoff if a client still hits the S3 error document (should be rare once the upload strategy above is in place).

### Orphan static cleanup (bucket size, vacation-safe)

We **do not** use S3 lifecycle **expiration** on `static/` or `flags/` (that would delete every object N days after **upload**, including the only copy of the live site if you stop deploying for N days).

After each deploy, CI runs `scripts/prune-stale-static.mjs`:

1. Read `_ops/static-inventory.json` uploaded by `deploy-static.mjs` (all `static/` and `flags/` keys from that build; see `scripts/staticDeployInventory.mjs`).
2. List objects under `static/` and `flags/`.
3. **Delete** objects that are **not** in the inventory and whose **LastModified** is older than **7 days** (grace for tabs still on the previous release).

`index.html`, `error.html`, `locales/`, and other root keys are never touched. **No deploy → no prune → nothing expires** while you are away.

Dry-run locally: `node scripts/prune-stale-static.mjs --stage dev --dry-run`.

## Cache headers

[`serverless.yml`](../serverless.yml) documents the intended cache headers; `scripts/staticDeployCache.mjs` applies the same values on upload:

- Fingerprinted assets (`static/**`, `flags/**`): `max-age=31536000, immutable`
- `index.html`, `error.html`: `no-cache, no-store, must-revalidate`
- Other objects: `max-age=3600`

Locale files uploaded by `publish-locales.mjs` use `max-age=3600`.

## Content Security Policy

`csp-policy.mjs` is the single source of truth. **Production CSP is enforced by a CloudFront response header**, not an HTML meta tag (duplicate policies are intersected by the browser, so an outdated CloudFront header can block features even after `csp-policy.mjs` changes are deployed to S3).

After editing `csp-policy.mjs`, deploy as usual; CI runs `node scripts/sync-cloudfront-csp.mjs --stage dev|prod` after `deploy-static.mjs`. To sync manually:

```bash
node scripts/sync-cloudfront-csp.mjs --stage dev
node scripts/sync-cloudfront-csp.mjs --stage prod
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

`.gitattributes` marks `ci-deps.prod.json`, `ci-deps.dev.json`, `package.json`, and `package-lock.json` with `merge=ours` so the branch you merge **into** keeps its pins. Run **`npm run setup-git`** once per clone to register Git’s `merge.ours` driver (attributes alone are not enough). Run `sync-deps` / `sync-deps:prod` on that branch when you intend to bump pins.

**GitHub pull-request merges** do not run custom merge drivers. Merge `develop` into `main` locally after `npm run setup-git`, or on the PR conflict UI keep the **base branch** copies of every file listed above (same for back-merging `main` into `develop`).

### Prod API lag

It is normal for a **prod** deploy to fail at build when application code on `main` uses a gameslib API that is not yet in the pinned prod gameslib version. Wait for `dep_update_prod` (or bump `ci-deps.prod.json` deliberately when releasing).

### AP dependency sync

- `npm run sync-deps` — apply `ci-deps.dev.json` to the lockfile.
- `npm run sync-deps:prod` — apply `ci-deps.prod.json` (prod registry checks apply on install).

CI always runs `ap-install-deps` before tests, lint, and build. `ap-check-ci-deps` is not part of `npm run lint`.

## Related

- [Configuration](/front/configuration/)
- [Getting started](/front/getting-started/)
