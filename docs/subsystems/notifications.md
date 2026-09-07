# Notifications

Browser push notifications alert users when it is their turn or when notable events occur. In-app notifications appear in the navbar bell panel; users configure email, in-app, and push preferences in [`UserSettingsModal.js`](../src/components/UserSettingsModal.js) (`settings.all.notifications` for email/push categories, `settings.all.inAppNotifications` for the in-app feed).

## Key files

| File | Role |
|------|------|
| [`NotificationBell.js`](../src/components/NotificationBell.js) | Navbar bell icon + dropdown panel (in-app feed) |
| [`notificationMessages.js`](../src/lib/notificationMessages.js) | Renders notification `body` types with links and i18n |
| [`useDismissNotification.js`](../src/hooks/useDismissNotification.js) | Per-item dismiss (`dismiss_notification`) |
| [`useDismissAllNotifications.js`](../src/hooks/useDismissAllNotifications.js) | Bulk dismiss (`dismiss_all_notifications`) |
| [`useMarkNotificationsSeen.js`](../src/hooks/useMarkNotificationsSeen.js) | Mark read (`mark_notifications_seen`) |
| [`useUnreadNews.js`](../src/hooks/useUnreadNews.js) | News callout + badge when `news-last-seen` is stale |
| [`subscription.js`](../src/subscription.js) | Per-device subscribe, delete, resync, and unregister-all |
| [`public/sw.js`](../public/sw.js) | Service worker (push handler) |
| [`src/index.js`](../src/index.js) | Service worker registration and in-app toast for focused-tab pushes |

## In-app bell panel

[`NotificationBell.js`](../src/components/NotificationBell.js) loads notifications via [`fetchNotifications()`](../src/lib/globalMeBootstrap.js) (`list_notifications`) when `globalMe.notifications` is unset. Badge count includes only **new** items (`status: 'new'`) plus unread news.

Panel layout (top to bottom):

1. **News callout** (if unread news) — link to `/news`
2. **Mark all read** — when any item is new (`mark_notifications_seen` with no `sks`)
3. **Notification list** — new items highlighted; per-row **Mark read**, **Dismiss**, and challenge **View**
4. **Dismiss all** — two-click confirm (`dismiss_all_notifications`)

English copy: `notifications.*` and `me.notifications.*` in [`public/locales/en/apfront.json`](../public/locales/en/apfront.json).

Backend item shape and TTL: [Notifications — In-app dashboard feed](/backend/subsystems/notifications/).

## Per-device subscription flow

Each browser/device is registered independently. The settings checkbox applies to **this device only**.

1. User checks "Push notifications on this device" in [`UserSettingsModal.js`](../src/components/UserSettingsModal.js).
2. `subscribeUser()` requests notification permission and calls `pushManager.subscribe()` with the VAPID public key from config (`PUSH_VAPID_PUBLIC_KEY` in [`global.js`](../src/config/global.js)).
3. Subscription is sent to the backend via `save_push`:

```javascript
callAuthApi("save_push", { payload: subscription.toJSON() })
```

4. On login, [`ProfileBootstrap.js`](../src/components/ProfileBootstrap.js) calls `resyncPushSubscription()` once to refresh the server record if this browser already has a subscription (no permission prompt).

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
- [Dashboard](/front/subsystems/dashboard/)
