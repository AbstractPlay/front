# Customize & themes

Users can customize board appearance per meta-game. Route: `/customize/:metaGame`.

## Key files

| File | Role |
|------|------|
| [`Customize.js`](../src/components/Customize.js) | Theme customizer page |
| [`ApplyCustomizationModal.js`](../src/components/ApplyCustomizationModal.js) | Bulk copy customization sections to other games |
| [`mergeCustomizationSections.js`](../src/lib/mergeCustomizationSections.js) | Partial merge for bulk apply |
| [`resolveEffectiveCustomCss.js`](../src/lib/resolveEffectiveCustomCss.js) | Account vs localStorage CSS resolution |
| [`useGameCustomCss.js`](../src/hooks/useGameCustomCss.js) | Mount/unmount per-game CSS on game pages |
| [`ThemeApplicator.js`](../src/components/ThemeApplicator.js) | Applies stored site theme globally |
| [`ThemeCustomizer.js`](../src/components/ThemeCustomizer.js) | Site chrome colour picker |
| [`RenderOptionsModal.js`](../src/components/RenderOptionsModal.js) | Renderer display options (also on game page) |
| [`setRendererColourOpts.js`](../src/lib/setRendererColourOpts.js) | Passes colour context to renderer |
| [`setGlyphMapOpt.js`](../src/lib/setGlyphMapOpt.js) | Glyph substitution map |

## Colour context

Zustand `colourContext` holds renderer colour overrides (background, strokes, labels, etc.). Light and dark presets are stored separately via `react-use-storage-state` in `Skeleton`:

- `stored-context-light`
- `stored-context-dark`

`color-mode` (`light` / `dark`) is also persisted and sets the `color-mode` attribute on `<html>`.

## Customization blob

Saved via `save_customization` / `delete_customization` on the user profile (`globalMe.customizations[metaGame]`). Fields include:

- `colourContext` — board drawing colours
- `palette` — player colour slots
- `glyphmap` — glyph substitutions
- `preferredColour` — viewer seat colour when possible
- `customCss` — `{ css, active }` account-backed per-game CSS

**Global defaults** (`_default`) apply to games without a per-game customization entry.

## Bulk apply

On the game-specific Customize page, **Apply to other games…** copies selected sections (palette, board colours, glyphs, preferred colour, custom CSS) to other games. Requires saving first. Merges into each target’s existing blob (selected sections only).

## Custom CSS (dual source)

1. **Account** — `customCss` in the customization blob (edited on Customize, included in bulk apply).
2. **Legacy localStorage** — `custom-css` key, edited from the board CSS3 toolbar modal.

**Precedence:** account CSS (per-game or `_default`) wins; localStorage is used only when no account CSS resolves.

When opening Customize for a game with localStorage CSS but no account CSS, legacy CSS is **imported into the editor** (dirty until saved). Saving stores it in the account and removes the localStorage entry for that game.

On game pages, [`useGameCustomCss`](../src/hooks/useGameCustomCss.js) applies CSS via `document.adoptedStyleSheets` and clears it on unmount or game change.

Boards use `div.board._meta_${metaGame}` for CSS selectors.

## Thumbnails

`Customize` loads preset thumbnails from:

```
https://thumbnails.abstractplay.com/{metaGame}.json
```

## Renderer integration

Customizations affect the JSON passed to `@abstractplay/renderer` `render()`. See [Renderer docs](/renderer/) for schema details.

Settings are saved to the user profile via auth queries and applied on game pages through shared helpers in [`src/lib/GameMove/settings.js`](../src/lib/GameMove/settings.js).

## Related

- [Game move](/front/subsystems/game-move/)
- [Styling](/front/guides/styling/)
- [Renderer](/renderer/)
