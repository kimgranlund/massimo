# Container

`ui-container` (React `Container`): one container for every level, from a group of controls to the page. API, defaults and avoidance guidance: [container.manifest.json](container.manifest.json) (`npm run registry -- component:container`). Examples: [container.examples.json](container.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

A `preset` picks where a container starts; three families, each with one radius rule:

- Wrappers hug their controls; radius concentric with them: the control radius + padding, min(3u·s, 4u) + p (square at s = 0).
  - `preset="group"`: closely related controls (toolbars, button and chip sets); a wrapping row, 1u.
  - `preset="collection"` (the default): a list or set of like items (tables, data lists); a stack, 2u.
- Cards are self-contained surfaces, concentric with their controls like wrappers: the control radius + padding.
  - `preset="card"` with `padding="xs | sm | md | lg | xl"` (2u…6u, md default), from thumbnails (xs) and small items in a grid (sm) to hero or dialog surfaces (xl). A card may hold a smaller card; a card nested in a card takes the page fill.
- Areas meet the viewport or other areas; square.
  - `preset="panel"`: a side or tool panel (the panel fill), 6u.
  - `preset="region"`: a major area of a page, 8u.
  - `preset="page"`: a whole page, 8u, a centered 72rem column.

`radius` (group, collection, card) scales the concentric radius by a magnitude t, 0…1 in 0.05 steps: 1 concentric, 0 square; the theme's `radius-group`, `radius-collection` and `radius-card` set the default. `<ui-container preset="collection" radius="0.25">` holds pill buttons in a nearly square box. `layout="stack | row | wrap"` and `surface="none | panel | card | raised"` override the preset's flow and elevation.

## Nesting

`resolveContainerTree` is the rule in numbers; the CSS chain (`containerChain`) computes the same:

- A root keeps its preset geometry: the ladder padding and the concentric radius (control radius + padding).
- A nested ui-container is concentric with its parent, R = R_parent − p_parent.
- A container that holds containers keeps a ratio for them, p = R − max(control radius, R × k) (k: the theme's `container-ratio`, 0.6). A nested leaf fits its controls, p = R − control radius, so the curves follow each other down to the buttons. A derived padding is never below 1u.
- `levels="n"` (1–8) on a container splits the padding evenly from it down instead, p = (R − control radius) / n: on the root, or on a container that starts a new chain under an area.
- Derived padding is also the gap unless `gap` is set.
- Areas (panel, region, page) are square and restart the chain, also mid-tree: a card inside a panel inside a card is a root again.
- `padding` on a group or collection gives it the card ladder level (its padding, gap and concentric radius); an area ignores `padding`.
- The chain has a rule per depth up to 8; a deeper container repeats its parent's radius.

```html
<ui-container preset="card" padding="xl">
  <ui-container preset="card">…</ui-container>
  <ui-container preset="card"><ui-container preset="group"><ui-button>Save</ui-button></ui-container></ui-container>
</ui-container>
```

## Usage

```html
<ui-container preset="card">
  <span data-type="heading-3">Spring catalog</span>
  <ui-container preset="group"><ui-button>Open</ui-button><ui-button>Share</ui-button></ui-container>
</ui-container>
```

Areas hold containers, containers hold wrappers: page › region › panel › card › collection › group (a level may be skipped). React: `<Container preset="card" padding="sm">`. Padding, gap and radius per level: [geometry](../../../../docs/specs/geometry.md#containers). Containers set no role.

## Geometry and appearance

Geometry family: `container` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipe in [container.recipe.ts](container.recipe.ts) (`root` only; preset, padding, layout and surface are variants) reads the geometry variables; fills are Spectrum roles (panel `bg.muted`, card `bg.subtle`, a nested card `bg`). The tag runs no script, so the recipe is emitted as global rules on `:is(ui-container, [data-ui=container])` (a variant on `[preset=card]`, `[padding=sm]`, …). The React `Container` renders `<div data-ui="container" preset="card" padding="sm">`, so both renderers get the same rules and the nesting chain in one CSS layer. The `gap` attribute (`gap` prop) sets `--ui-gap` on that element only.

The level tags `ui-group` … `ui-page` and the React `Group` … `Page` were removed ([decision 0016](../../../../docs/decisions/0016-remove-container-level-tags.md)).

## Renderers and verification

- webComponent: completed
- react: completed (`./container.react.tsx`; parity in `apps/studio/react-check.html`)

React props: `npm run registry -- --assembly component:container` (under `react`).

Checks and their latest run: [verification/container.verification.json](verification/container.verification.json).
