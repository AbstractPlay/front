# Challenges

Standing challenges let players post open invitations for a specific meta-game. Route: `/challenges/:metaGame`.

## Key files

| File | Role |
|------|------|
| [`StandingChallenges.js`](../src/components/StandingChallenges.js) | Standing challenge list and actions |
| [`StandingChallengeModal.js`](../src/components/StandingChallengeModal.js) | Create/edit modal (also used from dashboard) |
| [`Me/StandingChallengeTable.js`](../src/components/Me/StandingChallengeTable.js) | User's standing challenges on dashboard |

## Data loading

Open query `standing_challenges` with `metaGame` parameter returns active challenges. Authenticated actions (create, accept, cancel) use auth queries via `callAuthApi`.

## Dashboard integration

The `me` query returns the user's standing challenges. The dashboard table links to game pages when a challenge is accepted and a game is created.

Backend semantics: [Challenges](/backend/subsystems/challenges/).

## Related

- [Dashboard](/front/subsystems/dashboard/)
- [Explore](/front/subsystems/explore/)
