# Explore

The explore page lists available games and meta-games. Route: `/games/:metaGame?`.

## Key files

| File | Role |
|------|------|
| [`Explore.js`](../src/components/Explore.js) | Main explore page (lazy-loaded) |
| [`Explore/ExploreView.js`](../src/components/Explore/ExploreView.js) | Game grid / list rendering, tag filters, recommended-only filter |
| [`exploreViewConfigs.js`](../src/components/Explore/exploreViewConfigs.js) | Per-view options (e.g. `enableRecommendedFilter` on All Games) |
| [`MetaContainer.js`](../src/components/MetaContainer.js) | Meta-game detail wrapper and tabs |

## Data loading

Open queries:

- `meta_games` — list of game families
- `games` — games within a meta-game (with filters)

Optional `token` prop enables authenticated-only actions (e.g. starting a game while logged in).

## Recommendations filter

On the **All Games** view, logged-in users can enable **Recommended games only** to narrow the table to the current personalized recommendation set (same engine as the Game Picker carousel). Configured via `enableRecommendedFilter` in [`exploreViewConfigs.js`](../src/components/Explore/exploreViewConfigs.js).

See [Recommendations](/front/subsystems/recommendations/) for how picks are scored and how to hide suggestions in the Game Picker.

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

- [Recommendations](/front/subsystems/recommendations/) — personalized picks in Game Picker and Explore filter
- [Game move](/front/subsystems/game-move/)
- [Challenges](/front/subsystems/challenges/)
- [Gameslib](/gameslib/)
