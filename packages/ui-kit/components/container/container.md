# Containers

`ui-group`, `ui-collection`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`. API, defaults and avoidance guidance: [container.manifest.json](container.manifest.json) (`npm run registry -- component:card`). Examples: [container.examples.json](container.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Three families, each with one radius rule:

- Wrappers hug their controls; radius concentric with them: the control radius + padding, min(3u·s, 4u) + p (square at s = 0).
  - `ui-group`: closely related controls (toolbars, button and chip sets).
  - `ui-collection`: a list or set of like items (tables, data lists).
- Containers are self-contained surfaces; radius = padding.
  - `ui-card`: `padding="xs | sm | md | lg | xl"` (2u…6u, md default), from thumbnails (xs) and small items in a grid (sm) to hero or dialog surfaces (xl). A card may hold a smaller card.
- Areas meet the viewport or other areas; square.
  - `ui-panel`: a side or tool panel.
  - `ui-region`: a major area of a page.
  - `ui-page`: a whole page.

## Usage

```html
<ui-card>
  <span data-type="heading-3">Spring catalog</span>
  <ui-group><ui-button>Open</ui-button><ui-button>Share</ui-button></ui-group>
</ui-card>
```

Areas hold containers, containers hold wrappers: page › region › panel › card › collection › group (a level may be skipped). React: `<Card padding="sm">`. Padding, gap and radius per level: [geometry](../../../../docs/specs/geometry.md#containers). Containers set no role.

## Geometry and appearance

Geometry families: `container` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [container.recipe.ts](container.recipe.ts) (one per level, `root` only; the card's `padding` is a variant), read the geometry variables; fills are Spectrum roles (panel `bg.muted`, card `bg.subtle`, a nested card `bg`). The tags run no script, so the same recipes are also emitted as global rules on `ui-group` … `ui-page` (`ui-card[padding=sm]` for a variant); React and plain HTML use the classes (`<div data-ui="card" class="ui-card__root ui-card__root--padding_sm">`). The `gap` attribute (`gap` prop) sets `--ui-gap` on that element only.

## Renderers and verification

- webComponent: completed
- react: completed (`./container.react.tsx`)

React props: `npm run registry -- --assembly component:card` (under `react`).

Checks and their latest run: [verification/container.verification.json](verification/container.verification.json).
