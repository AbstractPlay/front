# Architecture

## Overview

The front end is a Create React App (CRA) project. The production bundle is a static SPA served from S3 via CloudFront. All application logic runs in the browser; the backend is accessed over HTTPS (REST-style RPC) and WebSockets.

## Boot sequence

```
index.js → i18n init → Skeleton.js → Bones (auth gate) → Router + routes
```

| File | Role |
|------|------|
| [`src/index.js`](../src/index.js) | React root, service worker registration |
| [`src/pages/Skeleton.js`](../src/pages/Skeleton.js) | Amplify config, auth bootstrap, router, global data fetch |
| [`src/stores/index.js`](../src/stores/index.js) | Zustand global store |

`Skeleton` blocks rendering behind a spinner until Cognito session resolution completes (`Bones` component).

## App shell

`Skeleton.js` mounts persistent chrome around all routes:

- **Amplify Auth** — Cognito OAuth configuration
- **React Router** — all route definitions
- **MyWebSocket** — real-time connection (see [WebSockets](/front/subsystems/websockets/))
- **ThemeApplicator** — applies user colour preferences to renderer output
- **Navbar** / **Footer** (or **FooterDev** on non-prod builds)
- **ToastContainer** — global notifications

On mount, `Skeleton` also fetches:

- `user_names` (open query) → Zustand `users`
- `https://records.abstractplay.com/_summary.json` → Zustand `summary`
- Embedded `news.json` → Zustand `news`

## Routing

All routes are declared in [`Skeleton.js`](../src/pages/Skeleton.js). Several heavy pages use `React.lazy()`:

- `Explore`, `Player`, `Stats`

`GameMoveWrapper` remounts `GameMove` when route params change so game state resets cleanly. See [Routing](/front/guides/routing/).

## State management

**Primary:** Zustand store at [`src/stores/index.js`](../src/stores/index.js).

| State | Purpose |
|-------|---------|
| `globalMe` | Authenticated user profile from `me` query |
| `users` | Username lookup table |
| `news` | Site news items |
| `summary` | Public site statistics |
| `colourContext` | Renderer colour overrides (light/dark) |
| `connections` | WebSocket presence counts |
| `invisible` | User opted out of visible presence |
| `myMove` | Transient move state shared across components |

**Secondary patterns:**

- Local `useState` in feature components
- `react-use-storage-state` for persisted UI prefs (colour mode, theme colours)
- JWT `token` passed as props from `Skeleton` to routes that need it

## External packages

| Package | Role |
|---------|------|
| `@abstractplay/gameslib` | `GameFactory`, `gameinfo`, move validation |
| `@abstractplay/renderer` | `render()` — JSON board representation → SVG |
| `aws-amplify` | Cognito authentication |
| `i18next` / `react-i18next` | Internationalization |
| `react-router-dom` | Client-side routing |
| `zustand` | Global state |
| `bulma` | CSS framework (compiled to `myBulma.css`) |

See [Gameslib docs](/gameslib/) and [Renderer docs](/renderer/) for package APIs.

## API integration

The client talks to [node-backend](/backend/) via two patterns:

1. **Open queries** — `GET {API_ENDPOINT_OPEN}?query=…&…`
2. **Auth queries** — `POST {API_ENDPOINT_AUTH}` with `Authorization: Bearer <jwt>`

Centralized in [`src/lib/api.js`](../src/lib/api.js). See [API client](/front/api/client/).

## Real-time

[`MyWebSocket`](../src/components/MyWebSocket.js) connects to `WS_ENDPOINT`, authenticates, and subscribes to topics. Incoming messages trigger toasts and store updates. See [WebSockets](/front/subsystems/websockets/).

## Static assets

| Asset | Source |
|-------|--------|
| Flag SVGs | `public/flags/` |
| i18n locale files | `public/locales/` |
| Service worker | `public/sw.js` |
| Game thumbnails | `https://thumbnails.abstractplay.com/{metaGame}.json` |

## Stages

Dev and prod are separate deployments with separate Cognito pools, API endpoints, and CloudFront distributions. Local dev (`npm start`) uses `src/config/local.js` pointed at the dev backend.

See [Configuration](/front/configuration/) and [Deployment](/front/deployment/).

## Related

- [Authentication](/front/auth/)
- [Project structure](/front/guides/project-structure/)
- [Backend architecture](/backend/architecture/)
