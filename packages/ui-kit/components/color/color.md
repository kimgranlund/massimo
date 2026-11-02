# Swatch and palette

`ui-swatch`, `ui-palette`. API, defaults and avoidance guidance: [color.manifest.json](color.manifest.json) (`npm run registry -- component:palette`). Examples: [color.examples.json](color.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-swatch`: show a color sample.
- `ui-palette`: show a ramp of colors; choose one color from a set when selectable.

## Usage

```html
<ui-palette name="accent" label="Accent" value="#3366ff">
  <ui-swatch color="#3366ff"></ui-swatch><ui-swatch color="#22aa66"></ui-swatch>
</ui-palette>
```

The swatch color reaches CSS only as `--ui-swatch-color`, set by script.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-palette` | arrows by orientation, Home, End | move and select (selectable) |

## Geometry and appearance

Geometry families: `swatch` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed (`./color.element.ts`)

Checks and their latest run: [verification/color.verification.json](verification/color.verification.json).
