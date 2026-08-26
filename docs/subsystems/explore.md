# Explore

The explore page lists available games and meta-games.

## Routes

| Route | Purpose |
|-------|---------|
| `/explore` | Redirects to last-visited catalog view (localStorage) |
| `/explore/:mode` | Catalog view (e.g. `/explore/all`, `/explore/hotRaw`) |
| `/games` | Redirects to `/explore` |
| `/games/:metaGame` | Game detail page (MetaItem tabs) |

Legacy bookmarks to `/games/:mode` where `:mode` is a catalog view slug redirect to `/explore/:mode`.

## Key files

| File | Role |
|------|------|
| [`Explore.js`](../src/components/Explore.js) | Routing, view selection, game detail wrapper |
| [`exploreSections.js`](../src/lib/exploreSections.js) | View ids, validation, display order |
| [`Explore/ExploreView.js`](../src/components/Explore/ExploreView.js) | Game grid / list rendering, tag filters, recommended-only filter |
| [`exploreViewConfigs.js`](../src/components/Explore/exploreViewConfigs.js) | Per-view options (e.g. `enableRecommendedFilter` on All Games) |
| [`MetaContainer.js`](../src/components/MetaContainer.js) | Meta-game detail wrapper and tabs |

## Data loading

Open queries:

- `meta_games` — list of game families
- `games` — games within a meta-game (with filters)

Optional `token` prop enables authenticated-only actions (e.g. starting a game while logged in).

## Per-view preferences

Each catalog view persists its own **Show** (page size) and **table/grid** layout in localStorage (`explore-show-{view}`, `explore-grid-{view}`). The last-selected view is stored under `selected-module`.

## Recommendations filter

On the **All Games** view, logged-in users can enable **Recommended games only** to narrow the table to the current personalized recommendation set (same engine as the Game Picker carousel). Configured via `enableRecommendedFilter` in [`exploreViewConfigs.js`](../src/components/Explore/exploreViewConfigs.js).

See [Recommendations](/front/subsystems/recommendations/) for how picks are scored and how to hide suggestions in the Game Picker.

## Navigation

From a meta-game page (`/games/:metaGame`), users can navigate to ratings, standing challenges, tournaments, and customize routes for that meta-game.

## Related routes

| Route | Component |
|-------|-----------|
| `/ratings/:metaGame` | `Ratings` |
| `/challenges/:metaGame` | `StandingChallenges` |
| `/tournaments/:tab?/:metaGame?` | `Tournaments` |
| `/customize/:metaGame` | `Customize` |
| `/listgames/:gameState/:metaGame` | `ListGames` |

## Related

- [Recommendations](/front/subsystems/recommendations/) — personalized picks in Game Picker and Explore filter
- [Game move](/front/subsystems/game-move/)
- [Challenges](/front/subsystems/challenges/)
- [Gameslib](/gameslib/)
