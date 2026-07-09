# WebSockets

Real-time updates (opponent moves, challenges, presence) use API Gateway WebSockets.

## Key file

[`MyWebSocket.js`](../src/components/MyWebSocket.js) — mounted once in `Skeleton`, always active while the app runs.

## Connection flow

1. Obtain JWT via [`getAuthToken()`](../src/lib/api.js).
2. Open WebSocket to `WS_ENDPOINT` from config.
3. On `open`, send a subscribe message with the token.
4. Server associates the connection with the user and game topics.

Backend flow: [WebSockets](/backend/subsystems/websockets/).

## Reconnection

Exponential backoff on disconnect:

- Initial delay: 2 seconds
- Maximum delay: 30 seconds
- Guards prevent duplicate connections while connecting or already open

## Presence

Incoming messages update Zustand `connections`:

```javascript
{ totalCount, visibleUserIds }
```

Users can set `invisible` to opt out of visible presence (stored in Zustand).

## Message handling

The component parses WebSocket messages and triggers:

- `react-toastify` notifications for notable events
- Store updates that cause dashboard/game views to refetch

## Related

- [Configuration](/front/configuration/) — `WS_ENDPOINT`
- [Authentication](/front/auth/)
- [Dashboard](/front/subsystems/dashboard/)
- [Game move](/front/subsystems/game-move/)
