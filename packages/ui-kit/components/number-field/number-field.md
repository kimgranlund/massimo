# Number Field

`ui-number-field`. API, defaults and avoidance guidance: [number-field.manifest.json](number-field.manifest.json) (`npm run registry -- component:number-field`). Examples: [number-field.examples.json](number-field.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Enter or adjust a number, such as a quantity, a price or a dimension, by typing, stepping or dragging ([Base UI Number Field](https://base-ui.com/react/components/number-field)). A position in a range is a `ui-range`; digits that are not a quantity (phone numbers, codes) are a `ui-input` or a `ui-otp-field`.

## Usage

```html
<ui-number-field name="quantity" label="Quantity" value="1" min="1" max="99"></ui-number-field>
<ui-number-field label="Price" value="1200" locale="de-DE" format='{"style":"currency","currency":"EUR"}'></ui-number-field>
<ui-number-field label="Width" value="240" step="8" snap-on-step><span slot="suffix">px</span></ui-number-field>
```

```tsx
import { NumberField } from '@massimo/ui-kit/components/number-field/react';
<NumberField label="Price" defaultValue={1200} locale="de-DE" format={{ style: 'currency', currency: 'EUR' }} onValueCommitted={(v) => save(v)} />
```

The value is a number, or `null` when the field is empty. The text is `formatNumber` from `@massimo/ui-kit/format` with `format` (Intl.NumberFormat options; JSON in the attribute) and `locale`: U+2212 minus, the locale's grouping, a narrow no-break space before a currency or unit; without a format, up to 3 fraction digits (more when `step` has more). The input carries `data-numeric`, so figures are tabular ([numerals](../../../../docs/specs/typography.md#numerals)). Typed text is parsed back in the locale (`parseNumber`, `dom/number.ts`): its digits and separators, U+2212 or a hyphen, the currency, unit and percent text its format writes (a percent divides by 100). Characters that cannot belong to a number are refused while typing and dropped from a paste.

Typing sets the value as soon as the text parses; blur or Enter commits: clamps to `min` / `max` (unless `allow-out-of-range`, which keeps the value and reports `rangeUnderflow` / `rangeOverflow`), snaps to the step grid with `snap-on-step`, and reformats. The form value is the number (empty when there is none), never the formatted text; React submits it from a hidden input.

## Anatomy

### Both forms

Preset or parts ([components spec](../../../../docs/specs/components.md#composition)); the same DOM, classes and data-*.

```html
<ui-number-field value="3">
  <span data-part="scrub-area"><span data-part="label">Copies</span></span>
  <div data-part="group">
    <span data-part="decrement"></span><span data-part="prefix">×</span><div data-part="input"></div><span data-part="increment"></span>
  </div>
  <span data-part="description">Up to 10</span>
</ui-number-field>
```

```tsx
<NumberField.Root defaultValue={3} max={10}>
  <NumberField.ScrubArea><NumberField.Label>Copies</NumberField.Label></NumberField.ScrubArea>
  <NumberField.Group prefix="×">
    <NumberField.Decrement />
    <NumberField.Input />
    <NumberField.Increment />
  </NumberField.Group>
  <NumberField.Description>Up to 10</NumberField.Description>
</NumberField.Root>
```

Web component: authored parts are adopted (attributes and classes); stepper content replaces the plus / minus glyph (an empty stepper keeps it), prefix and suffix content is appended; label, description and error text seed those properties. `slot="prefix"` / `"suffix"` children move into the group. React: `NumberField.Group` puts its `prefix` and `suffix` beside the `NumberField.Input`; `NumberField.Root` reads a `NumberField.Description` and `NumberField.Error` among its direct children to wire them.

- `part:number-field-scrub-area` `:scope > [data-part=scrub-area]`: Base UI ScrubArea, holding the label; hidden without one.
- `part:number-field-scrub-area-cursor` `:scope > [data-part=scrub-area] > [data-part=scrub-area-cursor]`: Base UI ScrubAreaCursor, an icon (the arrows along `scrub-direction`; authored content replaces them) shown in the top layer at the virtual pointer while a mouse drag holds the pointer locked. React: `NumberField.ScrubAreaCursor` inside `ScrubArea` (the preset has one).
- `part:number-field-label` `:scope > [data-part=scrub-area] > [data-part=label]`: names the input; a press focuses it.
- `part:number-field-group` `:scope > [data-part=group]`: the field control, `[decrement] [prefix] [input] [suffix] [increment]`; the focus ring paints here.
- `part:number-field-decrement`, `part:number-field-increment`: the steppers in the leading and trailing 6u slots (role=button / native buttons, `tabindex=-1`, `aria-label` Decrease / Increase, `aria-controls` the input).
- `part:number-field-input` `:scope > [data-part=group] > [data-part=input]`: the input (contenteditable role=textbox / `<input type="text">`, `aria-roledescription="Number field"`, `data-numeric`).
- `part:slot-prefix`, `part:slot-suffix` (in the group), `part:field-description`, `part:field-error`.

## Keyboard and pointer

| Input | Action |
|---|---|
| Arrow Up / Down | step by `step`; Shift: `large-step` (10), Alt: `small-step` (0.1); clamped; commits |
| Home / End | go to `min` / `max` when set; commits |
| Enter | commit, then submit the form |
| Stepper press | step once, then after 400 ms every 60 ms while held; commits on release |
| Scrub area drag | one step per `pixel-sensitivity` px (2) along `scrub-direction` (right / up increase; mirrored in RTL); `data-scrubbing`; commits on release; a press without a drag focuses the input. A mouse press locks the pointer to the scrub area (Base UI): the system cursor hides, movement never stops at the screen edge, and the scrub area cursor follows the movement, wrapping to the opposite edge. Touch, pen or a refused lock scrub on the pointer's position |
| Wheel | with `allow-wheel-scrub`, while the input is focused and the pointer is over the group: up increases; commits |

Steppers are not tab stops (Base UI): the keyboard steps with the arrows. Disabled and read-only stop every gesture; a stepper at its limit is `data-disabled`.

## State attributes

Host: the field state (`data-disabled`, `data-readonly`, `data-required`, `data-valid` / `data-invalid`, `data-dirty`, `data-touched`, `data-filled`, `data-focused`) and `data-scrubbing`; scrub area `data-scrubbing`; steppers `data-disabled` (also at the limit). All Base UI names ([states.json](../../contracts/states.json)).

## Events and values

| Renderer | Value | Events |
|---|---|---|
| `ui-number-field` | `value` (number or null), `default-value`, `min`, `max`, `step`, `small-step`, `large-step`, `snap-on-step`, `allow-out-of-range`, `allow-wheel-scrub`, `format`, `locale` | `input` on every change, `change` on every commit: `{ value, reason, event }` |
| React NumberField | `value`, `defaultValue`, the same options (camelCase) | `onValueChange(value, details)`, `onValueCommitted(value, details)` |

Reasons (Base UI): `input-change`, `input-clear`, `input-paste` (typing), `input-blur` (the commit after typing; also Enter), `keyboard`, `increment-press`, `decrement-press`, `scrub`, `wheel`.

## Geometry and appearance

Geometry family: `number-field` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveNumberField`): the field control (8u, pad u − B, the control radius and fill), the steppers in its 6u leading and trailing slots with the glyph at icon size sm and the concentric radius R − u, the text run 1u from each stepper (0.5u between text parts), the label 1.5u above. The lengths are the control variables of `styles/geometry.ts` (`--h`, `--pad`, `--slot`, `--icon-sm`, `--radius`). Styles: [number-field.recipe.ts](number-field.recipe.ts): the group is the field control (`bg.muted`, critical tint when invalid, subtle fill read-only, faded disabled); a stepper hovers to `bg.control` and presses to `bg.controlActive` on the feedback intent; the scrub area shows the resize cursor along its axis.

## Renderers and verification

- webComponent: completed (`./number-field.element.ts`)
- react: completed (`./number-field.react.tsx`)

Not implemented: `inputRef` (React: the input takes a `ref` through `render`).

Checks and their latest run: [verification/number-field.verification.json](verification/number-field.verification.json).
