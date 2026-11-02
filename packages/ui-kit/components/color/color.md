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

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-palette` / Palette | `data-orientation`; field state: `data-disabled`, `data-required`, `data-valid` / `data-invalid` (once shown: after blur or a blocked submit; an author error at once), `data-dirty`, `data-touched`, `data-filled`, `data-focused` |
| swatch in a selectable palette | `data-selected`; `data-highlighted` while the palette has focus (the keyboard outline) |
| `ui-swatch` / Swatch | `data-alpha` (translucent or missing color; ours), `data-invalid` (the color does not parse) |

## Geometry and appearance

Geometry families: `swatch` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [color.recipe.ts](color.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./color.element.ts`)
- react: completed (`./color.react.tsx`)

React props: `npm run registry -- --assembly component:palette` (under `react`).

Checks and their latest run: [verification/color.verification.json](verification/color.verification.json).
