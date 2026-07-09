# Customize & themes

Users can customize board appearance per meta-game. Route: `/customize/:metaGame`.

## Key files

| File | Role |
|------|------|
| [`Customize.js`](../src/components/Customize.js) | Theme customizer page |
| [`ThemeApplicator.js`](../src/components/ThemeApplicator.js) | Applies stored theme globally |
| [`ThemeCustomizer.js`](../src/components/ThemeCustomizer.js) | Colour picker UI |
| [`RenderOptionsModal.js`](../src/components/RenderOptionsModal.js) | Renderer display options (also on game page) |
| [`setRendererColourOpts.js`](../src/lib/setRendererColourOpts.js) | Passes colour context to renderer |
| [`setGlyphMapOpt.js`](../src/lib/setGlyphMapOpt.js) | Glyph substitution map |

## Colour context

Zustand `colourContext` holds renderer colour overrides (background, strokes, labels, etc.). Light and dark presets are stored separately via `react-use-storage-state` in `Skeleton`:

- `stored-context-light`
- `stored-context-dark`

`color-mode` (`light` / `dark`) is also persisted and sets the `color-mode` attribute on `<html>`.

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
