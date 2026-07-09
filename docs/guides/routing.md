# Routing

All routes are defined in [`src/pages/Skeleton.js`](../src/pages/Skeleton.js) inside a single `<Routes>` block.

## Route table

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `Welcome` | Home dashboard |
| `/move/:metaGame/:cbits/:gameID` | `GameMoveWrapper` | Live game |
| `/games/:metaGame?` | `Explore` | Lazy-loaded |
| `/player/:userid` | `Player` | Lazy-loaded |
| `/challenges/:metaGame` | `StandingChallenges` | |
| `/listgames/:gameState/:metaGame` | `ListGames` | |
| `/ratings/:metaGame` | `Ratings` | |
| `/tournaments/:metaGame?` | `Tournaments` | |
| `/tournament/:metaGame/:tournamentid` | `Tournament` | |
| `/tournament/:tournamentid` | `Tournament` | Legacy path variant |
| `/tournamenthistory/:metaGame` | `TournamentsOld` | |
| `/events` | `Events` | |
| `/event/:eventid` | `Event` | |
| `/lab` | `Lab` | |
| `/playground` | `Navigate → /lab` | Redirect |
| `/play` | `Play` | |
| `/customize/:metaGame` | `Customize` | |
| `/stats` | `Stats` | Lazy-loaded |
| `/news` | `News` | |
| `/about` | `About` | |
| `/legal` | `Legal` | |
| `/players` | `Players` | |
| `*` | `NotFound` | Catch-all |

## Lazy loading

Heavy pages use `React.lazy()` and render inside `Suspense` (fallback: `Spinner`):

```javascript
const Explore = lazy(() => import("../components/Explore"));
```

## GameMoveWrapper

[`GameMoveWrapper.js`](../src/components/GameMoveWrapper.js) uses a `key` derived from route params to force `GameMove` to remount when navigating between games. Without this, React would reuse component state across different games.

## Token prop

Some routes receive `token` from `Skeleton` (`Bones`):

```javascript
<Route path="/" element={<Welcome token={token} update={update} />} />
```

Not all routes need the token; many call `getAuthToken()` or `callAuthApi()` directly.

## Adding a new route

1. Create the component in `src/components/` or `src/pages/`.
2. Import it in `Skeleton.js` (use `lazy()` if the bundle is large).
3. Add a `<Route>` entry.
4. Add a navbar link in [`Navbar.js`](../src/components/Navbar.js) if user-facing.
5. Update this documentation and [`nav.json`](../nav.json) if applicable.

## SPA deployment

CloudFront serves `index.html` for unknown paths (via `serverless-single-page-app-plugin`) so deep links work on refresh.

## Related

- [Architecture](/front/architecture/)
- [Project structure](/front/guides/project-structure/)
