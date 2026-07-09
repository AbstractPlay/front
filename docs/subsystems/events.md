# Events

Multi-division competitive events with pairings and standings. Routes: `/events`, `/event/:eventid`.

## Key files

| File | Role |
|------|------|
| [`Events.js`](../src/components/Events.js) | Event list |
| [`Event.js`](../src/components/Event.js) | Single event page |
| [`Event/Pair.js`](../src/components/Event/Pair.js) | Pairing display |
| [`Event/Division.js`](../src/components/Event/Division.js) | Division standings |
| [`Event/GamesTable.js`](../src/components/Event/GamesTable.js) | Games within a division |

## Data loading

- Open query `get_events` — list events
- Event detail loads division, pairing, and game data via open and auth queries

Organizer actions (when authenticated as organizer) use auth queries.

Backend semantics: [Events](/backend/subsystems/events/).

## Related

- [Tournaments](/front/subsystems/tournaments/)
- [Game move](/front/subsystems/game-move/)
