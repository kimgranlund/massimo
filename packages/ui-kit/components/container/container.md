# Containers

`ui-group`, `ui-collection`, `ui-tile`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`. API, defaults and avoidance guidance: [container.manifest.json](container.manifest.json) (`npm run registry -- component:card`). Examples: [container.examples.json](container.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-group`: group closely related controls.
- `ui-collection`: hold a list or set of like items.
- `ui-tile`: present one small item in a grid.
- `ui-card`: present a self-contained piece of content.
- `ui-panel`: hold a side or tool panel.
- `ui-region`: mark a major area of a page.
- `ui-page`: hold a whole page.

## Usage

```html
<ui-card>
  <span data-type="heading-3">Spring catalog</span>
  <ui-group><ui-button>Open</ui-button><ui-button>Share</ui-button></ui-group>
</ui-card>
```

Levels nest outer to inner: page › region › panel › card › tile › collection › group (a level may be skipped). Padding, gap and radius per level: [geometry](../../../../docs/specs/geometry.md#containers). Containers set no role.

## Geometry and appearance

Geometry families: `container` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed

Checks and their latest run: [verification/container.verification.json](verification/container.verification.json).
