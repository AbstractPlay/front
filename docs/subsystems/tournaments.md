# Tournaments

Tournament list and detail pages. Routes: `/tournaments/:metaGame?`, `/tournament/:metaGame/:tournamentid`.

## Key files

| File | Role |
|------|------|
| [`Tournaments/Tournaments.js`](../src/components/Tournaments/Tournaments.js) | Tournament list |
| [`Tournaments/Tournament.js`](../src/components/Tournaments/Tournament.js) | Single tournament detail |
| [`Tournaments/TournamentsOld.js`](../src/components/Tournaments/TournamentsOld.js) | Legacy tournament history view |

## Data loading

- Open query `get_tournaments` — list tournaments (optional `metaGame` filter)
- Auth queries for registration, creation, and organizer actions

Tournament detail fetches bracket/standings data and links to individual game move pages for active games.

Backend semantics: [Tournaments](/backend/subsystems/tournaments/).

## Related

- [Events](/front/subsystems/events/)
- [Game move](/front/subsystems/game-move/)
