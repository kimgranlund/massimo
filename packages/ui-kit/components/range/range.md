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

### Both forms

Preset or parts ([components spec](../../../../docs/specs/components.md#composition)); the same DOM, classes and data-*. React's `Slider` is the Base UI name; `Range` is the same component.

```html
<ui-range value="25" label="Volume"><span data-part="track"><span data-part="indicator"></span></span><span data-part="thumb"></span></ui-range>
<ui-progress value="40"><span data-part="track"><span data-part="indicator"></span></span></ui-progress>
```

```tsx
<Slider.Root defaultValue={25} label="Volume">
  <Slider.Track><Slider.Indicator /></Slider.Track>
  <Slider.Thumb />
</Slider.Root>
<Progress.Root value={40}><Progress.Track><Progress.Indicator /></Progress.Track></Progress.Root>
```

Web component: authored parts are adopted (attributes and classes; the thumb's content). React: `Slider.Thumb` renders the painted thumb and the native range input after it, as Base UI's Thumb holds its input; the input is the element that takes keys, pointer and the form value, so it is not a part of its own, and `Slider.Root`'s native props (name, aria-*, data-*) go to it. `Progress.Root` renders the native `<progress>` after its parts. No Slider.Control or Slider.Value: the host is the control, and the value is shown outside (a field readout).

- `part:range-thumb` `:scope > [data-part=thumb]`: The thumb, inside the track like a switch thumb (track − u, inset 0.5u); offset 0.5u + ratio × (width − track). The fill wraps it with a concentric cap.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-range` | ArrowRight, ArrowUp / ArrowLeft, ArrowDown | step up / down (Left/Right flip in RTL) |
| `ui-range` | PageUp, PageDown | ±10% of the range |
| `ui-range` | Home, End | min / max |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-range` / Range | `data-orientation` (horizontal), `data-dragging` while a pointer drags; field state: `data-disabled`, `data-required`, `data-valid` / `data-invalid` (once shown: after blur or a blocked submit; an author error at once), `data-dirty`, `data-touched`, `data-filled`, `data-focused` |
| `ui-progress` / Progress | `data-indeterminate` without a value, `data-progressing` below the max, `data-complete` at the max |

## Events and values

Base UI's props and event details ([components spec](../../../../docs/specs/components.md#events-and-values)).

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-range` | `value`, `defaultValue` (`default-value`) | `input` on every change and `change` when an interaction ends with a new value: `detail { value, reason, event }`, reason `keyboard`, `track-press` (the press) or `drag` (after it) |
| React Range | `value`, `defaultValue` | `onValueChange(value, { reason, event })` and `onValueCommitted(value, { reason, event })` (the native change event), the same reasons; native `onChange` still fires |

## Geometry and appearance

Geometry families: `track` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [range.recipe.ts](range.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./range.element.ts`)
- react: completed (`./range.react.tsx`)

React props: `npm run registry -- --assembly component:range` (under `react`).

Checks and their latest run: [verification/range.verification.json](verification/range.verification.json).
