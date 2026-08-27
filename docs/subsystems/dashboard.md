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

`Me.js` calls [`fetchDashboard()`](../src/lib/globalMeBootstrap.js) (`me_dashboard` auth query) on mount and when `refresh` increments. Navbar and other chrome use `fetchProfile()` (`me_profile`) separately — profile fetches do **not** load or refresh in-app notifications.

The dashboard response drives:

- In-app notifications (when present)
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
| [`NotificationsTable.js`](../src/components/Me/NotificationsTable.js) | In-app notification feed (top of dashboard when non-empty) |
| [`MyTurnTable.js`](../src/components/Me/MyTurnTable.js) | Games where it is the user's turn |
| [`TheirTurnTable.js`](../src/components/Me/TheirTurnTable.js) | Games waiting on opponent |
| [`WatchedGamesTable.js`](../src/components/Me/WatchedGamesTable.js) | Spectated games (persistent watch list) |
| [`StandingChallengeTable.js`](../src/components/Me/StandingChallengeTable.js) | Active standing challenges |

### Notifications

[`NotificationsTable.js`](../src/components/Me/NotificationsTable.js) renders only when `globalMe.notifications.length > 0`. Columns: message, optional challenge note, time, dismiss.

- **Dismiss** — `dismiss_notification` with optimistic removal from `globalMe`
- **Preferences** — in-app categories are toggled in User Settings (`settings.all.inAppNotifications`), separate from email/push prefs
- **Challenge issued** — game name links to `/games/{metaGame}`; **View** opens [`ChallengeResponseModal.js`](../src/components/Me/ChallengeResponseModal.js) when the challenge is still in `challengesReceived`
- **Game start** — game name links to `/move/{metaGame}/0/{gameId}`
- **Game end / rating change** — **View** links to the move page
- **Completed game chat** — **View** links to `/move/{metaGame}/1/{gameId}` (completed game)
- **Event invitation** — `{organizer} has invited you to the event` with the event name linking to `/event/{eventId}`

Under **Your games**, a link downloads all completed game reports from `records.abstractplay.com`.

Creation rules and DynamoDB layout: [Notifications — In-app dashboard feed](/backend/subsystems/notifications/).

English copy lives under `me.notifications` in [`src/locales/en/apfront.json`](../src/locales/en/apfront.json).

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
- [Notifications (backend)](/backend/subsystems/notifications/)
