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

## Navbar game search

The magnifying glass in the navbar ([`GameSearch.js`](../src/components/GameSearch.js)) is the quick route to a game page. It filters the public catalog with `filterGameOptions` (the matching used by the game picker) and orders results with `rankGameSearchResults`, so title matches come first. Selecting a result navigates to `/games/:metaGame`.

## Key files

| File | Role |
|------|------|
| [`Explore.js`](../src/components/Explore.js) | Routing, view selection, game detail wrapper |
| [`exploreSections.js`](../src/lib/exploreSections.js) | View ids, validation, display order |
| [`Explore/ExploreView.js`](../src/components/Explore/ExploreView.js) | Game grid / list rendering, tag filters, recommended-only filter |
| [`Explore/ExploreTagFilterModal.js`](../src/components/Explore/ExploreTagFilterModal.js) | Advanced tag filter modal (All games) |
| [`exploreViewConfigs.js`](../src/components/Explore/exploreViewConfigs.js) | Per-view options (e.g. `enableRecommendedFilter` on All Games) |
| [`MetaContainer.js`](../src/components/MetaContainer.js) | Meta-game detail wrapper and tabs |

## Data loading

Open queries:

- `meta_games` — list of game families
- `games` — games within a meta-game (with filters)

Optional `token` prop enables authenticated-only actions (e.g. starting a game while logged in).

Tag ids on each game (`gameinfo.categories`) drive filters in the UI. Semantics and **generated lists of games per tag** are documented in [Categories & tags](/gameslib/categories/) on gameslib.

## Tag filters (All games view)

On **All games** (`/explore/all`), the Tags column provides:

| Control | Behavior |
|---------|----------|
| Tag dropdown | Quick filter: show games that have the selected category tag (combined with advanced rules using AND). |
| **Advanced filters…** | Modal for richer logic: per-dimension **Any of** / **All of** / **None of** (goals, mechanics, board, other); optional **OR groups**; **global exclude** list. |
| Row tag click | Sets the quick dropdown to that tag. |

Advanced rules and the quick tag can both apply: a game must satisfy the quick tag (if set) and the advanced spec (if any).

**Bookmarkable URLs** (tag state only — not name/designer search):

| Param | Meaning |
|-------|---------|
| `t` | Quick single tag id |
| `tf=2` | Advanced filter schema version |
| `g`, `m`, `b`, `o` | Dimension tag lists (optional `;a` all, `;n` none) |
| `x` | Global exclude tags |
| `grp` | URL-encoded JSON OR groups |

Example: `/explore/all?t=goal.territory&tf=2&m=mechanic>capture,mechanic>move`

Implementation: [`categoryTagFilter.js`](../src/lib/categoryTagFilter.js), [`ExploreTagFilterModal.js`](../src/components/Explore/ExploreTagFilterModal.js), [`ExploreView.js`](../src/components/Explore/ExploreView.js).

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
