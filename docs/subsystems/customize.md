# Customize & themes

Users can customize board appearance per meta-game. Route: `/customize/:metaGame`.

## Key files

| File | Role |
|------|------|
| [`Customize.js`](../src/components/Customize.js) | Theme customizer page |
| [`ApplyCustomizationModal.js`](../src/components/ApplyCustomizationModal.js) | Bulk copy customization sections to other games |
| [`mergeCustomizationSections.js`](../src/lib/mergeCustomizationSections.js) | Partial merge for bulk apply |
| [`normalizeCustomizationSettings.js`](../src/lib/normalizeCustomizationSettings.js) | Legacy `glyphmap` / `boardChrome` → `render.*` on read |
| [`resolveEffectiveRenderSettings.js`](../src/lib/resolveEffectiveRenderSettings.js) | Per-game vs `_default` render scope + validation |
| [`getDisplayRenderRep.js`](../src/lib/getDisplayRenderRep.js) | Merge `render.board` / `render.options` into the game rep before draw |
| [`customizeRenderSettings.js`](../src/lib/customizeRenderSettings.js) | Customize UI ↔ `render` blob, preflight, size limit |
| [`resolveEffectiveCustomCss.js`](../src/lib/resolveEffectiveCustomCss.js) | Account vs localStorage CSS resolution |
| [`useGameCustomCss.js`](../src/hooks/useGameCustomCss.js) | Mount/unmount per-game CSS on game pages |
| [`ThemeApplicator.js`](../src/components/ThemeApplicator.js) | Applies stored site theme globally |
| [`ThemeCustomizer.js`](../src/components/ThemeCustomizer.js) | Site chrome colour picker |
| [`RenderOptionsModal.js`](../src/components/RenderOptionsModal.js) | Renderer display options (also on game page) |
| [`setRendererColourOpts.js`](../src/lib/setRendererColourOpts.js) | Passes colour context to renderer |
| [`setGlyphMapOpt.js`](../src/lib/setGlyphMapOpt.js) | Glyph substitution map from resolved `render.glyphmap` |

## Colour context

Zustand `colourContext` holds renderer colour overrides (background, strokes, labels, etc.). Light and dark presets are stored separately via `react-use-storage-state` in `Skeleton`:

- `stored-context-light`
- `stored-context-dark`

`color-mode` (`light` / `dark`) is also persisted and sets the `color-mode` attribute on `<html>`.

## Customization blob

Saved via `save_customization` / `delete_customization` on the user profile (`globalMe.customizations[metaGame]`).

### Top-level fields (unchanged)

- `colourContext` — board drawing colours
- `palette` — player colour slots
- `preferredColour` — viewer seat colour when possible
- `customCss` — `{ css, active }` account-backed per-game CSS

### `render` — board layout, glyphs, rep options

New saves store renderer overrides under a single **`render`** object:

```json
{
  "render": {
    "board": {
      "style": "squares-checkered",
      "strokeWeight": 2,
      "labelScale": 1.25
    },
    "glyphmap": [
      ["piece", "meeple", 1.2]
    ],
    "options": ["hide-star-points", "hide-labels"]
  }
}
```

| Key | Applied via | Notes |
|-----|-------------|--------|
| `render.board` | `applyBoardChrome` → merged into **APRenderRep** before draw | Partial `boardBasic` merge; **no** `width` / `height` |
| `render.glyphmap` | Renderer `options.glyphmap` | `[original, replacement, scale?]` tuples |
| `render.options` | Replaces rep-level `options` when set | e.g. `hide-star-points`, `hide-labels` |

**`board.labelScale`** scales row/column coordinate labels (replaces fragile custom CSS on SVG `text` for that purpose). See [Renderer customization](/renderer/customization/).

**Board style swaps** are only allowed within compatible groups (e.g. flat squares ↔ vertex on eligible games). Stacked boards cannot take a vertex-only style — preflight blocks save.

**Markers:** if `render.board.markers` is omitted, the game’s markers are kept (and sanitized in live play). If present (including `[]`), markers are **replaced**.

**Size limit:** stringified `render` must be ≤ **8 KiB** on Customize save.

### Legacy fields (read-only compat)

Older profiles may still have:

- Top-level **`glyphmap`** — treated as `render.glyphmap` until the user saves again
- **`boardChrome`** — alias for `render.board`

`normalizeCustomizationSettings` merges these on read. Customize and bulk apply write **`render` only** and drop legacy keys when saving.

**Global defaults** (`_default`) apply to games without a per-game customization entry.

## Bulk apply

On the game-specific Customize page, **Apply to other games…** copies selected sections to other games. Requires saving first. Merges into each target’s existing blob (selected sections only).

Sections:

- Player colours (palette)
- Board colours (`colourContext`)
- **Renderer (board, glyphs, options)** — copies the whole `render` subtree; sources with only legacy `glyphmap` / `boardChrome` are normalized into `render` on the target
- Preferred colour
- Custom CSS

## Custom CSS (dual source)

1. **Account** — `customCss` in the customization blob (edited on Customize, included in bulk apply).
2. **Legacy localStorage** — `custom-css` key, edited from the board CSS3 toolbar modal.

**Precedence:** account CSS (per-game or `_default`) wins; localStorage is used only when no account CSS resolves.

When opening Customize for a game with localStorage CSS but no account CSS, legacy CSS is **imported into the editor** (dirty until saved). Saving stores it in the account and removes the localStorage entry for that game.

On game pages, [`useGameCustomCss`](../src/hooks/useGameCustomCss.js) applies CSS via `document.adoptedStyleSheets` and clears it on unmount or game change.

Boards use `div.board._meta_${metaGame}` for CSS selectors.

## SVG board DOM (custom CSS authors)

Player-facing customization how-to lives on the [community wiki](https://abstractplay.com/wiki/doku.php?id=customizing). This section is for developers and advanced users writing **custom CSS** on the Customize screen.

- Boards render as SVG inside `svg#theBoardSVG` (some stacking games also use `svg#theStackSVG`).
- Common groups: `g#labels`, `g#gridlines`, `g#tiles`, `g#pieces` (usually `use` elements), `defs` / `symbol` for glyphs (`aprender-glyph-…` ids).
- Elements that follow **player colours** often have `data-playerfill=true` and/or `data-playerstroke=true`.
- Prefer **Customize → coordinate label size** over CSS for label scaling; prefer **palette / board colours** before overriding glyph fills in CSS.
- CSS variables on the board container (names may change): `--svg-label-color`, `--svg-gridline-color`, `--svg-default-fill`, `--svg-volcano-caps`.

The board DOM is **not a stable public API** — verify selectors against a live game after renderer upgrades.

## Thumbnails

`Customize` loads preset thumbnails from:

```
https://thumbnails.abstractplay.com/{metaGame}.json
```

## Renderer integration

Customizations affect the JSON passed to `@abstractplay/renderer` `render()`:

1. **Colours** — `setRendererColourOpts`
2. **Display rep** — `getDisplayRenderRep(rawRep, resolveEffectiveRenderSettings(...))` then `sanitizeRenderRep` in live mode
3. **Glyphs** — `options.glyphmap` from resolved `render.glyphmap`

See [Renderer customization](/renderer/customization/) and [Renderer docs](/renderer/) for schema and registry rules.

Settings are saved to the user profile via auth queries and applied on game pages through [`useGameMoveSession.js`](../src/components/GameMove/useGameMoveSession.js) and shared helpers in [`prepareBoardRender.js`](../src/lib/prepareBoardRender.js).

## Related

- [Game move](/front/subsystems/game-move/)
- [Styling](/front/guides/styling/)
- [Renderer](/renderer/)
- [Renderer customization](/renderer/customization/)
