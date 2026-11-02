# Range and progress

`ui-range`, `ui-progress`. API, defaults and avoidance guidance: [range.manifest.json](range.manifest.json) (`npm run registry -- component:range`). Examples: [range.examples.json](range.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-range`: set a number within a bounded range by position.
- `ui-progress`: show how much of a task is done; show that work is ongoing when no value is set.

## Usage

```html
<ui-range label="Volume" name="volume" value="40" value-text="40%"></ui-range>
<ui-progress label="Upload" value="60"></ui-progress>
```

Pair a range with a visible label element and `aria-labelledby` when the label must be seen; `label` alone is not visible.

## Anatomy

- `part:range-thumb` `:scope > [data-part=thumb]`: The 4u thumb, positioned from --ui-ratio.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-range` | ArrowRight, ArrowUp / ArrowLeft, ArrowDown | step up / down (Left/Right flip in RTL) |
| `ui-range` | PageUp, PageDown | ±10% of the range |
| `ui-range` | Home, End | min / max |

## Geometry and appearance

Geometry families: `track` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [range.recipe.ts](range.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./range.element.ts`)

Checks and their latest run: [verification/range.verification.json](verification/range.verification.json).
