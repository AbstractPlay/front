# API client

The front end does not implement its own API. It calls [node-backend](/backend/api/overview/) through two client patterns. Query names and parameters are documented in the backend query catalogs — this page covers **how the client invokes them**.

## Endpoints

From [`src/config/index.js`](../src/config/index.js):

| Config key | Backend handler | Auth |
|------------|-----------------|------|
| `API_ENDPOINT_OPEN` | `/query` | None |
| `API_ENDPOINT_AUTH` | `/authQuery` | Cognito user JWT |

Bot queries (`/botQuery`) are not used by the browser client; see [Bot framework](/backend/bots/).

## Open queries (GET)

Unauthenticated reads use a GET with query parameters:

```
GET {API_ENDPOINT_OPEN}?query=<name>&<param>=<value>&…
```

Example from [`Skeleton.js`](../src/pages/Skeleton.js):

```javascript
const url = new URL(API_ENDPOINT_OPEN);
url.searchParams.append("query", "user_names");
const res = await fetch(url);
const result = await res.json();
```

Common open queries used by the client:

| Query | Used by |
|-------|---------|
| `user_names` | `Skeleton`, many list views |
| `meta_games` | `Explore`, `Customize` |
| `games` | `ListGames`, `Explore` |
| `get_game` | `GameMove` |
| `ratings` | `Ratings` |
| `standing_challenges` | `StandingChallenges` |
| `get_events` | `Events` |
| `get_tournaments` | `Tournaments` |

Full catalog: [Public queries](/backend/api/public-queries/).

## Auth queries (POST)

Authenticated actions use [`callAuthApi`](../src/lib/api.js):

```javascript
import { callAuthApi } from "../lib/api";

const res = await callAuthApi("me", { size: "small" });
if (!res) return; // redirected to login
const result = await res.json();
```

Request shape:

```
POST {API_ENDPOINT_AUTH}
Authorization: Bearer <jwt>
Content-Type: application/json

{ "query": "<name>", "pars": { … } }
```

`callAuthApi`:

1. Obtains the JWT via `Auth.currentAuthenticatedUser()`.
2. If no token and `requireAuth` is true (default), calls `Auth.federatedSignIn()` and returns `undefined`.
3. On HTTP 401/403, redirects to login.

Full catalog: [Auth queries](/backend/api/auth-queries/).

## Response envelope

API Gateway often wraps responses as:

```json
{ "statusCode": 200, "body": "<JSON string>" }
```

Components typically:

```javascript
const result = await res.json();
if (result.statusCode !== 200) { /* handle error */ }
const data = JSON.parse(result.body);
```

[`botApi.js`](../src/components/Bots/botApi.js) centralizes this parsing in `parseAuthResponse()` for bot management calls.

## Direct fetch for auth queries

Some code posts directly (e.g. push subscription in [`subscription.js`](../src/subscription.js)) using the same envelope shape instead of `callAuthApi`.

## WebSocket

Real-time updates use a separate WebSocket endpoint (`WS_ENDPOINT`). See [WebSockets](/front/subsystems/websockets/) and [Backend WebSockets](/backend/subsystems/websockets/).

## External static APIs

Not part of node-backend:

| URL | Purpose |
|-----|---------|
| `https://records.abstractplay.com/_summary.json` | Site statistics (`Skeleton`) |
| `https://thumbnails.abstractplay.com/{metaGame}.json` | Board thumbnail presets (`Customize`) |

## Related

- [Authentication](/front/auth/) — obtaining the JWT
- [API overview](/backend/api/overview/)
- [Architecture](/front/architecture/)
