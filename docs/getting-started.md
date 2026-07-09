# Getting started

## Prerequisites

- **Node.js 18** (matches CI; CRA supports 18.x)
- **npm**
- Access to the `@abstractplay` GitHub Packages scope
- A deployed [node-backend](/backend/getting-started/) dev stack (for API and Cognito)
- AWS CLI with profiles `AbstractPlayDev` and `AbstractPlayProd` (only for deployment)

## Clone and install

```bash
git clone https://github.com/AbstractPlay/front.git
cd front
npm install
```

## GitHub Packages

Private `@abstractplay/*` packages require a `.npmrc` in the repo root:

```
@abstractplay:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=<PAT with read:packages>
```

CI creates this from the `PAT_READ_PACKAGES` secret (see [`.github/workflows/deploy-dev.js.yml`](../.github/workflows/deploy-dev.js.yml)).

Use `npm run npm-login` for interactive login.

## Local gameslib and renderer

For normal development, published packages from GitHub Packages are sufficient. To test against local builds:

1. Clone and build [renderer](https://github.com/AbstractPlay/renderer) and [gameslib](https://github.com/AbstractPlay/gameslib).
2. Pack and install the tarballs:

```bash
npm uninstall @abstractplay/renderer
npm install ../renderer/abstractplay-renderer-<version>.tgz

npm uninstall @abstractplay/gameslib
npm install ../gameslib/abstractplay-gameslib-<version>.tgz
```

After changing gameslib or renderer, reinstall the dependency to pick up changes.

## Local configuration

Edit [`src/config/local.js`](../src/config/local.js) with the correct Cognito pool, app client, and API Gateway URLs for your dev backend. See [Configuration](/front/configuration/) for all keys.

Cognito app client callback URLs must include `http://localhost:3000`. See [Backend deployment — Cognito](/backend/deployment/).

## Run locally

```bash
npm start
```

This sets `REACT_APP_REAL_MODE=local` and starts the dev server on port 3000.

To preview a production build locally:

```bash
npm run start-prod
```

## Bulma CSS

If you change `src/myBulma.scss`, recompile:

```bash
npm run build-bulma
```

## i18n string extraction

After adding translatable strings:

```bash
npm run extract
```

See [Internationalization](/front/subsystems/i18n/).

## Project layout

| Path | Purpose |
|------|---------|
| `src/pages/` | Top-level page shells (`Skeleton`, `Welcome`) |
| `src/components/` | Feature UI components |
| `src/lib/` | Shared utilities, API helpers, game logic |
| `src/stores/` | Zustand global store |
| `src/config/` | Per-environment endpoints |
| `src/hooks/` | Custom React hooks |
| `public/` | Static assets, locales, service worker |
| `bin/` | Build helpers (sitemap, RSS, news) |
| `config/` | CRA/webpack/jest overrides |

See [Project structure](/front/guides/project-structure/) for conventions.

## Next steps

- [Configuration](/front/configuration/) — environment modes
- [Architecture](/front/architecture/) — how the app fits together
- [API client](/front/api/client/) — calling the backend

## Contact

Questions? Join [Discord #dev-curious](https://discord.abstractplay.com).
