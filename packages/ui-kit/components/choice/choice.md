# Checkbox, radio, switch

`ui-checkbox`, `ui-radio`, `ui-switch`. API, defaults and avoidance guidance: [choice.manifest.json](choice.manifest.json) (`npm run registry -- component:checkbox`). Examples: [choice.examples.json](choice.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-checkbox`: turn one independent option on or off; accept a statement such as terms when required.
- `ui-radio`: choose exactly one option from a small mutually exclusive set.
- `ui-switch`: turn a setting on or off with immediate effect.

## Usage

```html
<ui-checkbox name="terms" required>I accept the terms</ui-checkbox>
<ui-radio-group name="plan" value="free" label="Plan">
  <ui-radio value="free">Free</ui-radio>
  <ui-radio value="pro">Pro<span slot="suffix">$9</span></ui-radio>
</ui-radio-group>
<ui-switch name="wifi">Wi-Fi</ui-switch>
```

The indicator is the leading part; the label run follows with 1u after the slot and no padding at the end.

Radios outside a group element group by `name` (within their form or the document). Inside a [ui-radio-group](../radio-group/radio-group.md) (React `RadioGroup`) they group by membership: the group owns the value, name, disabled, read-only and validity, sets each radio's checked state, and fires `change` / `input` with `{ value, reason, event }` instead of the radio.

Inside a [ui-checkbox-group](../checkbox-group/checkbox-group.md) (React `CheckboxGroup`) the group owns the value list the same way; a checkbox with `parent` (React `parent`) is checked when every value is, mixed when some are, and checks or clears them all.

## Anatomy

### Both forms

Preset or parts ([components spec](../../../../docs/specs/components.md#composition)); the same DOM, classes and data-*:

```html
<ui-checkbox checked><span data-part="leading"><span data-part="indicator"></span></span><span data-part="contents">Accept</span></ui-checkbox>
<ui-switch><span data-part="indicator"><span data-part="thumb"></span></span>Wi-Fi<span data-part="suffix">on</span></ui-switch>
```

```tsx
<Checkbox.Root defaultChecked><Checkbox.Indicator />Accept</Checkbox.Root>
<Radio.Root name="plan" value="pro"><Radio.Indicator />Pro</Radio.Root>
<Switch.Root suffix="on"><Switch.Thumb />Wi-Fi</Switch.Root>
```

Web component: an authored indicator (alone or in `leading`) is kept and filled when empty (the checkbox marks, the switch thumb); authored slot spans keep their loose children. React: `Checkbox.Indicator` and `Radio.Indicator` render the leading slot around themselves; `Switch.Thumb` renders the leading slot and the track (the indicator) around the thumb, which `render` and `className` apply to. Other children are the label (contents); `prefix` and `suffix` stay props. The native input is rendered by the Root and cannot be a separate part: the `<label>` host is what makes a press on the text toggle it. Radios group by `name`, or by a RadioGroup (`ui-radio-group`) around them.

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

- `part:choice-indicator` `:scope > [data-part=leading] > [data-part=indicator]`: The indicator (aria-hidden; Base UI Checkbox.Indicator, Radio.Indicator): checkbox box with check and minus marks, radio circle with its dot, or switch track holding the thumb. Created at connect unless authored.
- `part:switch-thumb` `:scope > [data-part=leading] > [data-part=indicator] > [data-part=thumb]`: The switch knob (Base UI Switch.Thumb) inside the indicator track; slides 4u when checked.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-checkbox` | Space | toggle |
| `ui-radio` | Space | select |
| `ui-radio` | ArrowDown, ArrowRight / ArrowUp, ArrowLeft | move to and select the next / previous radio (wraps) |
| `ui-switch` | Space, Enter | toggle |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-checkbox` / Checkbox | `data-checked` or `data-unchecked`; `data-indeterminate` instead of either while mixed; field state: `data-disabled`, `data-required`, `data-valid` / `data-invalid` (once shown: after blur or a blocked submit; an author error at once), `data-dirty`, `data-touched`, `data-filled`, `data-focused` |
| `ui-radio` / Radio, `ui-switch` / Switch | `data-checked` or `data-unchecked`; field state |

`data-filled` means checked. `data-touched` is set when the user leaves the control or activates it. The React host mirrors its native input (a radio rereads itself on any change in its group).

## Events and values

Base UI's props and event details ([components spec](../../../../docs/specs/components.md#events-and-values)).

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-checkbox`, `ui-radio`, `ui-switch` | `checked`, `defaultChecked` (`default-checked`); `value` is the submitted string | `change` and `input`: `detail { checked, value, reason: 'none', event }` (Base UI's only reason for these) |
| React Checkbox, Radio, Switch | native `checked` / `defaultChecked` | `onCheckedChange(checked, { reason: 'none', event })`; native `onChange` still fires |

## Geometry and appearance

Geometry families: `choice` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [choice.recipe.ts](choice.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

**Attached switch** (`inset="none"` on ui-switch): the thumb fills the track inside its border (5u − 2B) and still travels 4u.

## Renderers and verification

- webComponent: completed (`./choice.element.ts`)
- react: completed (`./choice.react.tsx`)

React props: `npm run registry -- --assembly component:checkbox` (under `react`).

Checks and their latest run: [verification/choice.verification.json](verification/choice.verification.json).
