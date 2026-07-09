# Explore

The explore page lists available games and meta-games. Route: `/games/:metaGame?`.

## Key files

| File | Role |
|------|------|
| [`Explore.js`](../src/components/Explore.js) | Main explore page (lazy-loaded) |
| [`Explore/ExploreView.js`](../src/components/Explore/ExploreView.js) | Game grid / list rendering |
| [`MetaContainer.js`](../src/components/MetaContainer.js) | Meta-game detail wrapper and tabs |

## Data loading

Open queries:

- `meta_games` — list of game families
- `games` — games within a meta-game (with filters)

Optional `token` prop enables authenticated-only actions (e.g. starting a game while logged in).

## Navigation

- `/games` — all meta-games
- `/games/:metaGame` — games within one meta-game

From a meta-game page, users can navigate to ratings, standing challenges, tournaments, and customize routes for that meta-game.

## Related routes

| Route | Component |
|-------|-----------|
| `/ratings/:metaGame` | `Ratings` |
| `/challenges/:metaGame` | `StandingChallenges` |
| `/tournaments/:metaGame?` | `Tournaments` |
| `/customize/:metaGame` | `Customize` |
| `/listgames/:gameState/:metaGame` | `ListGames` |

## Related

- [Game move](/front/subsystems/game-move/)
- [Challenges](/front/subsystems/challenges/)
- [Gameslib](/gameslib/)
