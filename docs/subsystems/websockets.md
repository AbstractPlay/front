# WebSockets

Real-time updates (opponent moves, presence) use API Gateway WebSockets.

## Key files

- [`MyWebSocket.js`](../src/components/MyWebSocket.js) — connection lifecycle, subscribe, presence handling, periodic resync
- [`GameWatch.js`](../src/components/GameWatch.js) / [`useGameWatch.js`](../src/hooks/useGameWatch.js) — sync active game subscriptions to the server
- [`stores/index.js`](../src/stores/index.js) — `wsSend`, `applyPresenceMessage`, `connections` with `seq`

Mounted from `Skeleton` while the app runs.

## Connection flow

1. Obtain JWT via [`getAuthToken()`](../src/lib/api.js).
2. Open WebSocket to `WS_ENDPOINT` from config.
3. On `open`, send subscribe with `token`, `invisible`, and `watchVersion: 1`.
4. Server stores the connection, sends a presence **snapshot**, and debounces a join broadcast.
5. `GameWatch` sends `watchGames` whenever active games or the current game route change.

Backend flow: [WebSockets](/backend/subsystems/websockets/).

## Game subscriptions

`useGameWatch` builds the watch set from:

- Active dashboard games (`globalMe.games` in "my turn" or "their turn" — not completed)
- The current game page (`/move/:metaGame/:cbits/:gameID`)

When the set changes, the client sends `watchGames` with the full desired list. The server only delivers `game` events to matching subscribers.

On `game` messages, `MyWebSocket` dispatches:

- `refresh-me` — dashboard refetches `me()`
- `refresh-data` — open game page refetches

## Reconnection

Exponential backoff on disconnect:

- Initial delay: 2 seconds
- Maximum delay: 30 seconds
- Guards prevent duplicate connections while connecting or already open
- Tab visibility triggers reconnect after idle timeout (code 1001)

## Presence

Incoming `connections` messages use snapshot/delta format:

```javascript
// snapshot (subscribe, syncPresence)
{ type: "snapshot", seq, totalCount, visibleUserIds }

// delta (debounced join/leave)
{ type: "delta", seq, joins, leaves }
```

[`applyPresenceMessage`](../src/stores/index.js) updates Zustand `connections` (`totalCount`, `visibleUserIds`, `seq`):

- **Snapshot** — replace state
- **Delta** — apply joins/leaves; if `seq` gap detected, call `syncPresence`

**Periodic resync:** every 10 minutes while the tab is visible and the socket is open, send `syncPresence` (also on tab becoming visible). This caps drift from missed deltas.

Users can set `invisible` to opt out of visible presence (stored in Zustand).

## Related

- [Configuration](/front/configuration/) — `WS_ENDPOINT`
- [Authentication](/front/auth/)
- [Dashboard](/front/subsystems/dashboard/)
- [Game move](/front/subsystems/game-move/)
