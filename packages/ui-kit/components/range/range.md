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

- `part:range-thumb` `:scope > [data-part=thumb]`: The thumb, inside the track like a switch thumb (track − u, inset 0.5u); offset 0.5u + ratio × (width − track). The fill wraps it with a concentric cap.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-range` | ArrowRight, ArrowUp / ArrowLeft, ArrowDown | step up / down (Left/Right flip in RTL) |
| `ui-range` | PageUp, PageDown | ±10% of the range |
| `ui-range` | Home, End | min / max |

## Geometry and appearance

Geometry families: `track` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed (`./range.element.ts`)
- react: completed (`./range.react.tsx`)

React props: `npm run registry -- --assembly component:range` (under `react`).

Checks and their latest run: [verification/range.verification.json](verification/range.verification.json).
