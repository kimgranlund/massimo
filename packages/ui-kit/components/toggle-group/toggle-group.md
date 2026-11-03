# Toggle group

`ui-toggle-group`. API, defaults and avoidance guidance: [toggle-group.manifest.json](toggle-group.manifest.json) (`npm run registry -- component:toggle-group`). Examples: [toggle-group.examples.json](toggle-group.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Press one or several of a set of related toggles, such as text formatting or a view filter, with the pressed values owned by the group ([Base UI ToggleGroup](https://base-ui.com/react/components/toggle-group)). One required choice submitted with a form is a segmented control; independent form settings are a checkbox group.

## Usage

```html
<ui-toggle-group aria-label="Formatting" multiple value="bold,italic">
  <ui-toggle value="bold" aria-label="Bold"><i slot="leading" name="text-b"></i></ui-toggle>
  <ui-toggle value="italic" aria-label="Italic"><i slot="leading" name="text-italic"></i></ui-toggle>
  <ui-toggle value="underline" aria-label="Underline"><i slot="leading" name="text-underline"></i></ui-toggle>
</ui-toggle-group>
<ui-toggle-group aria-label="Alignment" default-value="left">
  <ui-toggle value="left">Left</ui-toggle><ui-toggle value="center">Center</ui-toggle><ui-toggle value="right">Right</ui-toggle>
</ui-toggle-group>
```

```tsx
import { ToggleGroup } from '@massimo/ui-kit/components/toggle-group/react';
import { Toggle } from '@massimo/ui-kit/components/toggle/react';
<ToggleGroup aria-label="Formatting" multiple value={marks} onValueChange={(next) => setMarks(next)}>
  <Toggle value="bold" aria-label="Bold" leading={<i name="text-b" />} />
  <Toggle value="italic" aria-label="Italic" leading={<i name="text-italic" />} />
</ToggleGroup>
```

Single mode (the default) presses one toggle at a time and lets the pressed one be released, so the value may be empty. `multiple` lets several be pressed. Name the group with `aria-label` or `aria-labelledby`; icon-only toggles need their own `aria-label`.

## Anatomy

### Both forms

One part, the group (`role=group`), holding toggles ([components spec](../../../../docs/specs/components.md#composition)); each toggle keeps its construction pattern ([toggle](../toggle/toggle.md)). There are no generated parts, so the authored form is the preset.

```html
<ui-toggle-group multiple value="b"><ui-toggle value="b"><span data-part="contents">Bold</span></ui-toggle><ui-toggle value="i"><span data-part="contents">Italic</span></ui-toggle></ui-toggle-group>
```

```tsx
<ToggleGroup multiple defaultValue={['b']} render={<div />} className={(s) => (s.multiple ? 'many' : undefined)}>
  <Toggle value="b">Bold</Toggle><Toggle value="i">Italic</Toggle>
</ToggleGroup>
```

Web component: `ui-toggle` children are the toggles; a toggle's value is its `value`, else its index. React: `Toggle` children with a `value` read the pressed values from the group (ToggleGroupContext) and report presses to it; `render` replaces the group element (the recipe class and data-* stay), `className` may be a function of the state `{ orientation, disabled, multiple }`.

## Keyboard

| Keys | Action |
|---|---|
| Enter, Space | press or release the focused toggle (single mode: pressing releases the others) |
| ArrowRight, ArrowLeft (ArrowDown, ArrowUp when vertical) | move focus to the next / previous enabled toggle, wrapping; Left / Right flip in RTL |
| Home, End | move focus to the first / last enabled toggle |

One toggle is the tab stop: the last focused, else the first pressed, else the first enabled.

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-toggle-group` / ToggleGroup | `data-orientation` (horizontal or vertical), `data-disabled`, `data-multiple` |
| its toggles | `data-pressed`, `data-disabled` ([toggle](../toggle/toggle.md)) |

## Events and values

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-toggle-group` | `value` (comma-separated pressed values), `defaultValue` (`default-value`); without either the toggles' `pressed` / `default-pressed` seed it | `change`: `detail { value: string[], reason: 'none', event }`, cancelable (`preventDefault` keeps every toggle); the toggle's own `change` does not leave the group |
| React ToggleGroup | `value`, `defaultValue` (`string[]`) | `onValueChange(value, { reason: 'none', event })`; a Toggle's `onPressedChange` still fires |

No form value: submit the group's value from application state.

## Geometry and appearance

Geometry family: `container` ([geometry-families.json](../../contracts/geometry-families.json): `resolveComposite`), like `ui-segmented`: the group is a composite on the control fill (`bg.control`) with padding D − B (D = max(B, pad-composite · u)), the composite gap (the `gap` attribute wins) and a radius concentric with its toggles, capped at half the 8u row when horizontal. Its toggles are composite options: 7u tall (6u + 2·Ic), inset Ic − B, radius min(h/2, R − D), their label padding the control family's. Styles: [toggle-group.recipe.ts](toggle-group.recipe.ts) for the group; the toggle recipe's in-group rules ([toggle.recipe.ts](../toggle/toggle.recipe.ts)) give the toggles no fill and muted text until hovered and the raised selected fill (`bg.selected`, `fg.selected`, shadow sm) while pressed; the focus ring is inset so it stays inside the group; forced colors paint pressed toggles `Highlight`.

## Renderers and verification

- webComponent: completed (`./toggle-group.element.ts`)
- react: completed (`./toggle-group.react.tsx`)

Checks and their latest run: [verification/toggle-group.verification.json](verification/toggle-group.verification.json).
