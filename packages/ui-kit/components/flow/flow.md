# Column, list and grid

`ui-column`, `ui-list` and `ui-grid` (React `Column`, `List`, `Grid`): layout primitives that arrange their children. API, defaults and avoidance guidance: [flow.manifest.json](flow.manifest.json).

## Intent

`ui-row` lays out one line. These cover the other three flows, with no fill, border or padding of their own:

- `ui-column` stacks children in document order.
- `ui-list` stacks list items and drops their markers.
- `ui-grid` wraps tiles to fill the row, as many as fit `min`, or a fixed `columns`.

## Usage

```html
<ui-column gap="3" align="start">
  <h2>Team</h2>
  <p>Everyone on this workspace.</p>
</ui-column>

<ui-list role="list" gap="1">
  <div role="listitem">Comments</div>
  <div role="listitem">Mentions</div>
</ui-list>

<ui-grid min="sm" gap="4">
  <ui-container preset="card"><ui-section>One</ui-section></ui-container>
  <ui-container preset="card"><ui-section>Two</ui-section></ui-container>
</ui-grid>
```

- `gap` is the gutter in u, 0 to 8 in 0.5 steps, the same input as a container's. The default is 2u.
- `align` on a column or list sets the cross axis. The default is stretch.
- `min` is the smallest tile: `sm` 40u, `md` 60u (the default), `lg` 80u. A tile never overflows a narrower parent.
- `columns` fixes the count at 1 to 6 or 12 and wins over `min`. It doesn't respond to width, so use it where the parent's width is known.
- `ui-list` has no script, so a web list states `role="list"` and `role="listitem"` itself. React `List` renders a native `ul`: give it `li` children.

## Geometry and appearance

No fill, border or padding. Numbers: `resolveFlow`.

## Renderers and verification

The web tags have no script. React renders `<div data-ui="column">`, `<ul data-ui="list">` and `<div data-ui="grid">` with the same rules. `apps/studio/geometry-check.html` compares gaps and tracks with the resolver; `react-check.html` compares the twins.
