# Deployment

The front end is a static SPA deployed to S3 and served through CloudFront using the Serverless Framework and `serverless-finch`.

## Stages

| Stage | URL | S3 bucket | Branch / trigger |
|-------|-----|-----------|-------------------|
| `dev` | [play.dev.abstractplay.com](https://play.dev.abstractplay.com) | `abstract-play-dev` | `develop` push |
| `prod` | [play.abstractplay.com](https://play.abstractplay.com) | `abstract-play-prod` | Version tags (`v*`) |

Defined in [`serverless.yml`](../serverless.yml).

## Build commands

| Command | Effect |
|---------|--------|
| `npm run build-dev` | Production build with `REACT_APP_REAL_MODE=development` |
| `npm run build-prod` | Production build with `REACT_APP_REAL_MODE=production`; generates sitemap |
| `npm run deploy` | Upload `build/` to dev S3 bucket |
| `npm run deploy-prod` | Upload `build/` to prod S3 bucket (`--stage prod`) |
| `npm run full-dev` | `build-dev` + CloudFront invalidation + deploy |
| `npm run full-prod` | `build-prod` + CloudFront invalidation + deploy |

## AWS setup

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Configure profiles `AbstractPlayDev` and `AbstractPlayProd` in `~/.aws/credentials`.
3. Install Serverless globally: `npm install -g serverless`.
4. First-time stack setup: `serverless deploy` (dev) and `serverless --stage prod deploy` (prod) to create S3 buckets and CloudFront distributions.
5. Copy CloudFront distribution IDs into the `invalidate` and `invalidate-prod` scripts in [`package.json`](../package.json).

## CI/CD

GitHub Actions workflows:

- [`.github/workflows/deploy-dev.js.yml`](../.github/workflows/deploy-dev.js.yml) — push to `develop`
- [`.github/workflows/deploy-prod.js.yml`](../.github/workflows/deploy-prod.js.yml) — version tags

CI steps:

1. Install Serverless and npm dependencies (with GitHub Packages auth).
2. Install `@abstractplay/renderer@development` and `@abstractplay/gameslib@development`.
3. `npm run build-dev` or `build-prod`.
4. `serverless client deploy`.
5. CloudFront cache invalidation.

## Cache headers

[`serverless.yml`](../serverless.yml) sets object headers on upload:

- Fingerprinted assets (`static/**`, `flags/**`): `max-age=31536000, immutable`
- `index.html`, `error.html`: `no-cache, no-store, must-revalidate`
- Other objects: `max-age=3600`

## SPA routing

The `serverless-single-page-app-plugin` rewrites unknown paths to `index.html` so client-side routing works on refresh.

## Dependencies on other repos

CI installs `@development` tags of gameslib and renderer on each deploy. Gameslib CI can also trigger a front rebuild via `repository_dispatch` when rules engine changes land.

## Related

- [Configuration](/front/configuration/)
- [Getting started](/front/getting-started/)
