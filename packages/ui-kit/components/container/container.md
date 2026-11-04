# Containers

`ui-group`, `ui-collection`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`. API, defaults and avoidance guidance: [container.manifest.json](container.manifest.json) (`npm run registry -- component:card`). Examples: [container.examples.json](container.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Three families, each with one radius rule:

- Wrappers hug their controls; radius concentric with them: the control radius + padding, min(3u·s, 4u) + p (square at s = 0).
- `radius` (group, collection, card) scales that radius by a magnitude t, 0…1 in 0.05 steps: 1 concentric, 0 square; the theme's `radius-group`, `radius-collection` and `radius-card` set the default. `<ui-container preset="collection" radius="0.25">` holds pill buttons in a nearly square box.
  - `ui-group`: closely related controls (toolbars, button and chip sets).
  - `ui-collection`: a list or set of like items (tables, data lists).
- Cards are self-contained surfaces, concentric with their controls like wrappers: the control radius + padding.
  - `ui-card`: `padding="xs | sm | md | lg | xl"` (2u…6u, md default), from thumbnails (xs) and small items in a grid (sm) to hero or dialog surfaces (xl). A card may hold a smaller card.
- Areas meet the viewport or other areas; square.
  - `ui-panel`: a side or tool panel.
  - `ui-region`: a major area of a page.
  - `ui-page`: a whole page.

## ui-container (use this)

`<ui-container>` (React `Container`) is the one container for every level, from a group of controls to the page. The six level tags (`ui-group`, `ui-collection`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`) are deprecated aliases of its presets and take part in the same nesting.

- `preset`: `group` (a wrapping row, 1u), `collection` (a stack, 2u; the default), `card` (a card surface, 4u), `panel` (the panel fill, square), `region` (square, 8u), `page` (square, 8u, a centered 72rem column).
- `padding="xs | sm | md | lg | xl"`: the card ladder level, for any preset. `layout="stack | row | wrap"` and `surface="none | panel | card | raised"` override the preset's.
- **Nesting** (`resolveContainerTree`): a root keeps its preset geometry, the ladder padding and the concentric radius (control radius + padding). A nested ui-container is concentric with its parent, R = R_parent − p_parent. A container that holds containers keeps a ratio for them, p = R − max(control radius, R × k) (k: the theme's `container-ratio`, 0.6), and a nested leaf fits its controls, p = R − control radius, so the curves follow each other down to the buttons. `levels="n"` on the root splits the padding evenly instead, p = (R − control radius) / n. Derived padding is also the gap unless `gap` is set. Areas (panel, region, page) are square and restart the chain; up to 6 levels.

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

Areas hold containers, containers hold wrappers: page › region › panel › card › collection › group (a level may be skipped). React: `<Card padding="sm">`. Padding, gap and radius per level: [geometry](../../../../docs/specs/geometry.md#containers). Containers set no role.

## Geometry and appearance

Geometry families: `container` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [container.recipe.ts](container.recipe.ts) (one per level, `root` only; the card's `padding` is a variant), read the geometry variables; fills are Spectrum roles (panel `bg.muted`, card `bg.subtle`, a nested card `bg`). The tags run no script, so the same recipes are also emitted as global rules on `ui-group` … `ui-page` (`ui-card[padding=sm]` for a variant); React and plain HTML use the classes (`<div data-ui="card" class="ui-card__root ui-card__root--padding_sm">`). The `gap` attribute (`gap` prop) sets `--ui-gap` on that element only.

## Renderers and verification

- webComponent: completed
- react: completed (`./container.react.tsx`)

React props: `npm run registry -- --assembly component:card` (under `react`).

Checks and their latest run: [verification/container.verification.json](verification/container.verification.json).
