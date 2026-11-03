# Range and progress

`ui-range`, `ui-progress`. API, defaults and avoidance guidance: [range.manifest.json](range.manifest.json) (`npm run registry -- component:range`). Examples: [range.examples.json](range.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-range`: set a number within a bounded range by position; with a pair value, set a sub-range (start and end) with two thumbs.
- `ui-progress`: show how much of a task is done; show that work is ongoing when no value is set.

## Usage

```html
<ui-range label="Volume" name="volume" value="40" value-text="{value}%"></ui-range>
<ui-range label="Price" name="price" value="20,80"></ui-range>
<ui-progress label="Upload" value="60"></ui-progress>
```

Two thumbs (Base UI Slider with an array value): `value="20,80"` (or `el.value = [20, 80]`; React `defaultValue={[20, 80]}`). The host becomes a group named by `label`; each thumb is a slider and a tab stop named "<label>, minimum" and "<label>, maximum". Thumbs stop at each other (they may meet, never cross); a press on the track moves the nearer thumb (when they meet, the one on the side of the press) and focuses it; the indicator runs between them. With a `name`, the form gets one entry per thumb (`FormData.getAll(name)` gives `['20', '80']`). `value-text` names each thumb's value: `{value}` stands for that thumb's value (`value-text="{value} °C"` reads "20 °C" and "80 °C"); text without `{value}` is used as written. React also takes a function, `valueText={(value, index) => …}` (Base UI `getAriaValueText`).

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

Web component: authored parts are adopted (attributes and classes; the thumb's content). React: `Slider.Thumb` renders the painted thumb and the native range input after it, as Base UI's Thumb holds its input; the input is the element that takes keys, pointer and the form value, so it is not a part of its own; it is transparent over the root, so with one thumb the root draws the keyboard focus ring (the same box as the web component's focused host), and with two each thumb draws its input's. `Slider.Root`'s native props (name, aria-*, data-*) go to it. `Progress.Root` renders the native `<progress>` after its parts. No Slider.Control or Slider.Value: the host is the control, and the value is shown outside (a field readout).

- `part:range-thumb` `:scope > [data-part=thumb]`: The thumb, inside the track like a switch thumb (track − u, inset 0.5u); offset 0.5u + ratio × (width − track). The fill wraps it with a concentric cap.

A pair has two thumbs (`data-index` 0 and 1, each with its own `--ui-ratio`); the host's `--ui-ratio-start` starts the indicator. Authored, write one thumb per value:

```html
<ui-range value="20,80" label="Price"><span data-part="track"><span data-part="indicator"></span></span><span data-part="thumb"></span><span data-part="thumb"></span></ui-range>
```

```tsx
<Slider.Root defaultValue={[20, 80]} label="Price">
  <Slider.Track><Slider.Indicator /></Slider.Track>
  <Slider.Thumb index={0} />
  <Slider.Thumb index={1} />
</Slider.Root>
```

React: each pair thumb's input takes keys, its name and its form entry; the inputs ignore the pointer and the root maps it, as the web component does. The field's `id`, `aria-labelledby` and `aria-describedby` go to the group.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-range` | ArrowRight, ArrowUp / ArrowLeft, ArrowDown | step up / down (Left/Right flip in RTL) |
| `ui-range` | PageUp, PageDown | ±10% of the range |
| `ui-range` | Home, End | min / max |
| pair thumb | the same keys | move the focused thumb; it stops at the other thumb |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-range` / Range | `data-orientation` (horizontal), `data-dragging` while a pointer drags (a pair: also on the dragged thumb, with `data-index` on each thumb); field state: `data-disabled`, `data-required`, `data-valid` / `data-invalid` (once shown: after blur or a blocked submit; an author error at once), `data-dirty`, `data-touched`, `data-filled`, `data-focused` |
| `ui-progress` / Progress | `data-indeterminate` without a value, `data-progressing` below the max, `data-complete` at the max |

## Events and values

Base UI's props and event details ([components spec](../../../../docs/specs/components.md#events-and-values)).

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-range` | `value`, `defaultValue` (`default-value`) | `input` on every change and `change` when an interaction ends with a new value: `detail { value, reason, event }`, reason `keyboard`, `track-press` (the press) or `drag` (after it); a pair's value is `[start, end]` and `input` adds `activeThumbIndex` |
| React Range | `value`, `defaultValue` (a number or `[start, end]`) | `onValueChange(value, { reason, event, activeThumbIndex? })` and `onValueCommitted(value, { reason, event })` (the native change event), the same reasons; native `onChange` still fires |

## Geometry and appearance

Geometry families: `track` (a pair's fill: `trackPairFill`; [geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [range.recipe.ts](range.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

**Attached** (`inset="none"`): the thumb fills the 4u track and takes the track's radius (it becomes the track's end cap) and travels W − track from the start edge.

## Renderers and verification

- webComponent: completed (`./range.element.ts`)
- react: completed (`./range.react.tsx`)

React props: `npm run registry -- --assembly component:range` (under `react`).

Checks and their latest run: [verification/range.verification.json](verification/range.verification.json).
