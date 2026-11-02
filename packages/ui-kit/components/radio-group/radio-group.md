# Radio group

`ui-radio-group`. API, defaults and avoidance guidance: [radio-group.manifest.json](radio-group.manifest.json) (`npm run registry -- component:radio-group`). Examples: [radio-group.examples.json](radio-group.examples.json). Contract: [components.json](../../contracts/components.json). Base UI: [Radio Group](https://base-ui.com/react/components/radio-group).

## Intent

Choose exactly one option from a small set, with one value, one form name and one validity for the set.

## Usage

```html
<ui-field label="Plan">
  <ui-radio-group name="plan" value="pro">
    <ui-radio value="free">Free</ui-radio>
    <ui-radio value="pro">Pro</ui-radio>
    <ui-radio value="team">Team</ui-radio>
  </ui-radio-group>
</ui-field>
```

The group owns the value. `value` checks the radio with that value (no event); a press, Space or an arrow key on a radio changes it, and the group fires `input` and `change` with `{ value, reason: 'none', event }` (Base UI `onValueChange`); the radios inside fire none of their own. Without `value`, `default-value` or a radio authored `checked` is the first value, and form reset returns to it.

- **Form**: the group submits `name=value`; its radios need no name and submit nothing. `required` makes the group invalid (`valueMissing`) until a radio is checked.
- **Keyboard**: the radios keep theirs: Tab enters at the checked radio (or the first enabled one), arrows move and check within this group only (radios group by membership, not by name), Space checks.
- **disabled / readonly** on the group reach every radio (`isDisabled` reads the group; a disabled `ui-fieldset` or `<fieldset>` around it does the same). Read-only radios focus but do not change.
- **Naming**: a wrapping `ui-field` label names the group (`aria-labelledby`; a label press focuses the tab-stop radio), a `ui-fieldset` legend names the set around it, or `label` sets `aria-label`.
- **orientation**: `vertical` (default) or `horizontal` (a wrapping row; `aria-orientation`).

React: `<RadioGroup name="plan" defaultValue="pro" onValueChange={(value, { reason, event }) => …}><Radio value="free">Free</Radio>…</RadioGroup>`. The radios are native radios that take the group's name (generated when omitted), checked state, disabled and required from context, so the browser keeps the arrow keys, the roving tab stop and the form value.

## Anatomy

### Both forms

Like Base UI's, the group is a single part: a host around its radios.

```html
<ui-radio-group name="plan" value="pro" orientation="horizontal">
  <ui-radio value="free">Free</ui-radio>
  <ui-radio value="pro">Pro</ui-radio>
</ui-radio-group>
```

```tsx
<RadioGroup name="plan" defaultValue="pro" orientation="horizontal">
  <Radio.Root value="free"><Radio.Indicator />Free</Radio.Root>
  <Radio value="pro">Pro</Radio>
</RadioGroup>
```

### Generated

```html
<ui-radio-group role="radiogroup" data-orientation="vertical" data-filled class="ui-radio-group__root ui-radio-group__root--orientation_vertical">
  <ui-radio role="radio" aria-checked="true" tabindex="0" data-checked …>…</ui-radio>
  <ui-radio role="radio" aria-checked="false" tabindex="-1" data-unchecked …>…</ui-radio>
</ui-radio-group>
```

React: `<div role="radiogroup" data-ui="radio-group" data-orientation="vertical" class="ui-radio-group__root …">` around `<label data-ui="radio">` hosts with their native radios.

## States

The host carries the field state (`data-disabled`, `data-readonly`, `data-required`, `data-valid` / `data-invalid` once shown, `data-dirty`, `data-touched`, `data-filled` when a radio is checked, `data-focused` while focus is within) and `data-orientation`; each radio its own `data-checked` / `data-unchecked` and field state. The group draws nothing for them: the radios fade when disabled and tint when invalid.

## Geometry

Family `choice-group` (`resolveChoiceGroup`): the 6u choice rows 1u apart (a 7u pitch, like composite items); horizontal 4u between radios (a radio label has no end padding) and 1u between wrapped lines. The `gap` attribute (in u) replaces the gap along the direction. No padding, border or radius: each radio's focus ring stays its own.
