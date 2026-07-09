# Project structure

## Top-level layout

```
front/
├── .github/workflows/   # CI deploy
├── bin/                 # Build scripts (sitemap, RSS, news)
├── config/              # CRA webpack/jest overrides
├── docs/                # Developer documentation (this site)
├── public/              # Static assets, locales, service worker
├── src/                 # Application source
├── serverless.yml       # AWS deploy config
└── package.json
```

## `src/` conventions

| Directory | Purpose |
|-----------|---------|
| `pages/` | Top-level route shells. `Skeleton.js` is the app root; `Welcome.js` is the home page. |
| `components/` | Feature UI. One file or folder per feature. Large features get subfolders (e.g. `GameMove/`, `Tournaments/`, `Lab/`). |
| `lib/` | Shared non-UI logic: API helpers, game-move utilities, Lab builders, clipboard, colour helpers. |
| `stores/` | Zustand global store (`index.js`). |
| `hooks/` | Custom React hooks. |
| `config/` | Environment-specific endpoints (not to be confused with root `config/` CRA overrides). |
| `assets/` | Static JSON bundled at build time (e.g. `news.json`). |

## Component organization

- **Flat components** — single-purpose pages: `About.js`, `Ratings.js`, `Events.js`.
- **Feature folders** — complex subsystems with multiple child components: `GameMove/`, `Me/`, `Bots/`, `Event/`, `Explore/`, `MetaContainer/`, `Tournaments/`, `Lab/`.
- **Chrome** — `Navbar.js`, `Footer.js`, `FooterDev.js`, `Spinner.js`, `Modal.js`.

## When to use `lib/` vs `components/`

| Put in `lib/` | Put in `components/` |
|---------------|----------------------|
| Pure functions, no JSX | React components |
| Shared between multiple features | Feature-specific UI |
| API helpers, game logic | Layout and interaction |

Example: exploration tree logic is in `lib/GameMove/exploration.js`; the board is `components/GameMove/Board.js`.

## Config vs environment

- **`src/config/`** — runtime endpoints and Cognito settings (imported as `../config`).
- **Root `config/`** — Create React App eject-style overrides for webpack, jest, paths. Rarely edited.

## Static assets

- **`public/`** — served as-is (flags, locales, `sw.js`, favicons).
- **`src/assets/`** — imported/bundled assets.

## Private packages

Game logic and rendering come from `@abstractplay/gameslib` and `@abstractplay/renderer`. Do not duplicate rules or render schema in the front repo.

## Related

- [Architecture](/front/architecture/)
- [Routing](/front/guides/routing/)
