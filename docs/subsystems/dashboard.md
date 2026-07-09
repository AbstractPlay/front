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

`Me.js` fetches the full `me` auth query on mount and when `refresh` increments. The response drives:

- Games awaiting the user's move
- Games awaiting opponent's move
- Open challenges (issued, received, accepted)
- Standing challenges
- Bot status (via [`botApi.js`](../src/components/Bots/botApi.js))

Partial `me` data may already be in Zustand `globalMe` from navbar login; `Me` merges and extends it.

## Tables

| Component | Content |
|-----------|---------|
| [`MyTurnTable.js`](../src/components/Me/MyTurnTable.js) | Games where it is the user's turn |
| [`TheirTurnTable.js`](../src/components/Me/TheirTurnTable.js) | Games waiting on opponent |
| [`CompletedGamesTable.js`](../src/components/Me/CompletedGamesTable.js) | Finished games |
| [`StandingChallengeTable.js`](../src/components/Me/StandingChallengeTable.js) | Active standing challenges |

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
