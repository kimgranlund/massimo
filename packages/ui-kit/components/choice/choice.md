# Checkbox, radio, switch

`ui-checkbox`, `ui-radio`, `ui-switch`. API, defaults and avoidance guidance: [choice.manifest.json](choice.manifest.json) (`npm run registry -- component:checkbox`). Examples: [choice.examples.json](choice.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-checkbox`: turn one independent option on or off; accept a statement such as terms when required.
- `ui-radio`: choose exactly one option from a small mutually exclusive set.
- `ui-switch`: turn a setting on or off with immediate effect.

## Usage

```html
<ui-checkbox name="terms" required>I accept the terms</ui-checkbox>
<div role="radiogroup" aria-label="Plan">
  <ui-radio name="plan" value="free" checked>Free</ui-radio>
  <ui-radio name="plan" value="pro">Pro<span slot="suffix">$9</span></ui-radio>
</div>
<ui-switch name="wifi">Wi-Fi</ui-switch>
```

The indicator is the leading part; the label run follows with 1u after the slot and no padding at the end.

## Anatomy

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

- `part:choice-box` `:scope > [data-part=leading] > [data-part=box]`: The indicator (aria-hidden): checkbox box with check and minus marks, radio dot, or switch track and thumb. Created at connect unless authored.

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

## Geometry and appearance

Geometry families: `choice` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [choice.recipe.ts](choice.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./choice.element.ts`)
- react: completed (`./choice.react.tsx`)

React props: `npm run registry -- --assembly component:checkbox` (under `react`).

Checks and their latest run: [verification/choice.verification.json](verification/choice.verification.json).
