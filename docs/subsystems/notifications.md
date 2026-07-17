# Notifications

Browser push notifications alert users when it is their turn or when notable events occur.

## Key files

| File | Role |
|------|------|
| [`subscription.js`](../src/subscription.js) | Per-device subscribe, delete, resync, and unregister-all |
| [`public/sw.js`](../public/sw.js) | Service worker (push handler) |
| [`src/index.js`](../src/index.js) | Service worker registration and in-app toast for focused-tab pushes |

## Per-device subscription flow

Each browser/device is registered independently. The settings checkbox applies to **this device only**.

1. User checks "Push notifications on this device" in [`UserSettingsModal.js`](../src/components/UserSettingsModal.js).
2. `subscribeUser()` requests notification permission and calls `pushManager.subscribe()` with the VAPID public key from config (`PUSH_VAPID_PUBLIC_KEY` in [`global.js`](../src/config/global.js)).
3. Subscription is sent to the backend via `save_push`:

```javascript
callAuthApi("save_push", { payload: subscription.toJSON() })
```

4. On login, [`LogInOutButton.js`](../src/components/LogInOutButton.js) calls `resyncPushSubscription()` to refresh the server record if this browser already has a subscription (no permission prompt).

### Disable on this device

Unchecking the box calls `delete_push` with the subscription endpoint, then `pushManager.unsubscribe()` locally.

### Unregister all devices

A separate control calls `set_push({ state: false })`, which removes every `PUSH` record for the user on the server, then unsubscribes locally on the current browser.

## Service worker

Registered on window `load` in `index.js`. When the tab is focused, the service worker posts a message to the page (shown as a toast); otherwise it displays an OS notification.

Backend delivery: [Notifications](/backend/subsystems/notifications/).

## Related

- [Authentication](/front/auth/)
- [API client](/front/api/client/)
- [Configuration](/front/configuration/)
