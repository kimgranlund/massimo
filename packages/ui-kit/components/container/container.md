# Containers

`ui-group`, `ui-collection`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`. API, defaults and avoidance guidance: [container.manifest.json](container.manifest.json) (`npm run registry -- component:card`). Examples: [container.examples.json](container.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Three families, each with one radius rule:

- Wrappers hug their children; radius concentric with them (3u + padding).
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

Geometry families: `container` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed
- react: completed (`./container.react.tsx`)

React props: `npm run registry -- --assembly component:card` (under `react`).

Checks and their latest run: [verification/container.verification.json](verification/container.verification.json).
