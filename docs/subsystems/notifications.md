# Notifications

Browser push notifications alert users when it is their turn or when notable events occur.

## Key files

| File | Role |
|------|------|
| [`subscription.js`](../src/subscription.js) | Subscribe/unsubscribe logic |
| [`public/sw.js`](../public/sw.js) | Service worker (push handler) |
| [`src/index.js`](../src/index.js) | Service worker registration |

## Subscription flow

1. User grants notification permission (prompted after login in [`LogInOutButton.js`](../src/components/LogInOutButton.js)).
2. Service worker registers at `/sw.js`.
3. `registration.pushManager.subscribe()` with VAPID public key from config (`PUSH_VAPID_PUBLIC_KEY` in [`global.js`](../src/config/global.js)).
4. Subscription object sent to backend via auth query `save_push`:

```javascript
POST {PUSH_API_URL}
{ "query": "save_push", "pars": { "payload": subscription } }
```

## Service worker

Registered on window `load` in `index.js`. The service worker handles incoming push events and displays notifications even when the tab is in the background.

Backend delivery: [Notifications](/backend/subsystems/notifications/).

## Related

- [Authentication](/front/auth/)
- [API client](/front/api/client/)
- [Configuration](/front/configuration/)
