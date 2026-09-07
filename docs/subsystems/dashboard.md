# Dashboard

The home page (`/`) shows the authenticated user's game dashboard.

## Component hierarchy

```
Welcome → Main → Me
```

| File | Role |
|------|------|
| [`Welcome.js`](../src/pages/Welcome.js) | Home page wrapper |
| [`Main.js`](../src/components/Main.js) | Layout shell for dashboard |
| [`Me.js`](../src/components/Me.js) | Dashboard logic and tables |

## Data loading

`Me.js` calls [`fetchDashboard()`](../src/lib/globalMeBootstrap.js) (`me_dashboard` auth query) on mount and when `refresh` increments. Navbar chrome uses `fetchProfile()` (`me_profile`) and [`fetchNotifications()`](../src/lib/globalMeBootstrap.js) (`list_notifications`) separately — profile fetches do **not** load in-app notifications.

The dashboard response drives:

- Games awaiting the user's move
- Games awaiting opponent's move
- Open challenges (issued, received, accepted)
- Standing challenges
- Completed games (post-game chat via in-app notifications; browse older games on per-metaGame list pages)
- Watched games
- Bot status (via [`botApi.js`](../src/components/Bots/botApi.js))

Partial data may already be in Zustand `globalMe` from navbar login; `fetchDashboard` merges into `globalMe` with `{ ...prev, ...dashboard }`.

Backend: [Auth queries — Profile and dashboard](/backend/api/auth-queries/) (`me_dashboard`, `dismiss_notification`).

## Tables

| Component | Content |
|-----------|---------|
| [`MyTurnTable.js`](../src/components/Me/MyTurnTable.js) | Games where it is the user's turn |
| [`TheirTurnTable.js`](../src/components/Me/TheirTurnTable.js) | Games waiting on opponent |
| [`WatchedGamesTable.js`](../src/components/Me/WatchedGamesTable.js) | Spectated games (persistent watch list) |
| [`StandingChallengeTable.js`](../src/components/Me/StandingChallengeTable.js) | Active standing challenges |

### In-app notifications

The dashboard **no longer** hosts a notifications table. The navbar [`NotificationBell.js`](../src/components/NotificationBell.js) is the sole in-app feed UI. See [Notifications (front)](/front/subsystems/notifications/).

Under **Your games**, a link downloads all completed game reports from `records.abstractplay.com`.

## Challenges

Modal flows for creating and responding to challenges:

- [`NewChallengeModal.js`](../src/components/NewChallengeModal.js)
- [`ChallengeMeRespond.js`](../src/components/Me/ChallengeMeRespond.js)
- [`ChallengeTheyRespond.js`](../src/components/Me/ChallengeTheyRespond.js)
- [`ChallengeOpen.js`](../src/components/Me/ChallengeOpen.js)
- [`StandingChallengeModal.js`](../src/components/StandingChallengeModal.js)

Backend semantics: [Challenges](/backend/subsystems/challenges/).

## Profile creation

If the user has no profile, [`NewProfile.js`](../src/components/NewProfile.js) is shown before the dashboard tables.

## WebSocket refresh

Dashboard tables update when WebSocket messages arrive (e.g. opponent moved, new challenge). See [WebSockets](/front/subsystems/websockets/).

## Related

- [Authentication](/front/auth/)
- [Challenges](/front/subsystems/challenges/)
- [Bots](/front/subsystems/bots/)
- [Notifications (front)](/front/subsystems/notifications/)
- [Notifications (backend)](/backend/subsystems/notifications/)
