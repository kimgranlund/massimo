# Container

`ui-container` (React `Container`): one container for every level, from a group of controls to the page. API, defaults and avoidance guidance: [container.manifest.json](container.manifest.json) (`npm run registry -- component:container`). Examples: [container.examples.json](container.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

A `preset` picks where a container starts; three families, each with one radius rule:

- Wrappers hug their controls; radius concentric with them: the control radius + padding, min(3u·s, 4u) + p (square at s = 0).
  - `preset="group"`: closely related controls (toolbars, button and chip sets); a wrapping row, 1u.
  - `preset="collection"` (the default): a list or set of like items (tables, data lists); a stack, 2u.
- Cards are self-contained surfaces, never rounder than they are deep: radius = padding × min(1, corner scale). A card's content stays on the padding edge. Only composed content takes the text edge, like a field label: `data-row` rows, as its children or inside an unpainted wrapper, and the one text block directly above rows or a `divided` list, as their header. Give a layout div `data-row` to move it. A `padding="xs"` card keeps everything on the padding edge.
  - `preset="card"` with `padding="xs | sm | md | lg | xl"` (2u, 3u, 4u, 6u, 8u; md default), from thumbnails (xs) and small items in a grid (sm) to hero or dialog surfaces (xl). A card may hold a smaller card; a card nested in a card takes the page fill.
- Areas meet the viewport or other areas; square.
  - `preset="panel"`: a side or tool panel (the panel fill), 6u.
  - `preset="region"`: a major area of a page, 8u.
  - `preset="page"`: a whole page, 8u, a centered 72rem column.

`radius` (group, collection, card) scales the radius by a magnitude t, 0…1 in 0.05 steps (cards to 4): 1 the default, 0 square; the theme's `radius-group`, `radius-collection` and `radius-card` set the default. `<ui-container preset="collection" radius="0.25">` holds pill buttons in a nearly square box. `layout="stack | row | wrap"` and `surface="none | panel | card | raised"` override the preset's flow and elevation.

## Nesting

`resolveContainerTree` is the rule in numbers; the CSS chain (`containerChain`) computes the same:

- Padding is the input and radius follows.
- A root keeps its preset geometry: the ladder padding and its radius. A card's radius is its padding × min(1, corner scale); a wrapper's is the control radius + its padding.
- A nested container is concentric when its parent has room: R = max(R_parent − p_parent, R_parent × k; k is the theme's `container-ratio`, 0.4).
- A nested card steps down the ladder, p = max(min(3u, p_parent), p_parent − 1u) × density, and that padding is also its gap.
- An unpainted group or collection (no `surface`, no `padding`) has no padding or border, keeps its ladder gap, and passes its parent through. Its contents share an edge with what sits beside it, and a card directly under an unpainted root is a root.
- `padding` on a nested card, and any painted wrapper, takes the ladder padding and gap. `padding` on a group or collection gives it the card ladder level; an area ignores `padding`.
- `divided` on a group or collection makes an outlined box of full-bleed rows with lines between them. The box has no padding or gap, and each child is a row with 3u above and below (× density) and the text edge beside it, so its text meets a card's text above it. Text right before it in a card takes the same block padding, as its header row.
- Areas (panel, region, page) are square and restart the chain, also mid-tree: a card inside a panel inside a card is a root again.
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
