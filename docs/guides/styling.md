# Styling

## CSS stack

| Layer | File | Purpose |
|-------|------|---------|
| Bulma | [`src/myBulma.css`](../src/myBulma.css) | Compiled from [`src/myBulma.scss`](../src/myBulma.scss) |
| Custom | [`src/index.css`](../src/index.css) | App-wide overrides and utilities |
| Component | Inline `className` | Bulma classes (`section`, `button`, `table`, etc.) |

Bulma is imported in [`src/index.js`](../src/index.js) before `index.css`.

## Compiling Bulma

After editing `myBulma.scss`:

```bash
npm run build-bulma
```

Uses `sass` with `--load-path=node_modules` so Bulma's SCSS can be imported.

## Dark mode

Colour mode is stored in `localStorage` via `react-use-storage-state` (`color-mode` key in `Skeleton`). Valid values: `light`, `dark`.

The `color-mode` attribute on `<html>` drives CSS selectors in `index.css` for theme-aware styling.

## Renderer colours

Board colours are separate from page chrome. User customizations flow through Zustand `colourContext` and into the renderer. See [Customize & themes](/front/subsystems/customize/).

## Third-party CSS

- `react-toastify/dist/ReactToastify.css` — toast notifications
- Plotly styles bundled with `react-plotly.js` (stats page)

## Formatting

```bash
npm run format
```

Runs Prettier on `src/**/*.{js,jsx}`.

## Related

- [Customize & themes](/front/subsystems/customize/)
- [Project structure](/front/guides/project-structure/)
