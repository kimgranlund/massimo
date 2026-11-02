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

## Geometry and appearance

Geometry families: `choice` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed (`./choice.element.ts`)

Checks and their latest run: [verification/choice.verification.json](verification/choice.verification.json).
