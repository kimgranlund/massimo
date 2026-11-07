# Page

`ui-page-surface` (React `PageSurface`): a normal-flow document surface. API, defaults and avoidance guidance: [page-surface.manifest.json](page-surface.manifest.json).

## Usage

```html
<ui-page-surface width="readable" gap="4">
  <h1>Title</h1>
  <p>Body copy.</p>
</ui-page-surface>
```

- `width`: `readable` (160u, the default), `wide` (320u) or `full` (335u), the same limits as `ui-content-shell`.
- `gap` sets the space between direct children, in u.
- The page doesn't scroll. The shell around it does.

## Geometry and appearance

A fixed 6u inset (`resolvePage`). Local font size doesn't change it, and a page has no fill.

## Renderers and verification

The web tag has no script. React `PageSurface` renders `<div data-ui="page-surface">` with the same rules.
