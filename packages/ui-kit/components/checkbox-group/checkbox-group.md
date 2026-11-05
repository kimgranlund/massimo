# Checkbox group

`ui-checkbox-group`. API, defaults and avoidance guidance: [checkbox-group.manifest.json](checkbox-group.manifest.json) (`npm run registry -- component:checkbox-group`). Examples: [checkbox-group.examples.json](checkbox-group.examples.json). Contract: [components.json](../../contracts/components.json). Base UI: [Checkbox Group](https://base-ui.com/react/components/checkbox-group).

## Intent

Choose any number of options from a small set, with one value list for the set; check or clear them all with a parent checkbox.

## Usage

```html
<ui-field label="Notify by">
  <ui-checkbox-group name="channels" value="email">
    <ui-checkbox parent>All channels</ui-checkbox>
    <ui-checkbox value="email">Email</ui-checkbox>
    <ui-checkbox value="push">Push</ui-checkbox>
    <ui-checkbox value="sms">SMS</ui-checkbox>
  </ui-checkbox-group>
</ui-field>
```

The group owns the value, a `string[]` (the attributes `value`, `default-value` and `all-values` take space-separated values). Setting `value` checks those checkboxes and clears the rest (no event); a press or Space on a checkbox adds or removes its value, and the group fires `input` and `change` with `{ value, reason: 'none', event }` (Base UI `onValueChange`); the checkboxes inside fire none of their own. Without `value`, `default-value` or the checkboxes authored `checked` are the first value, and form reset returns to it.

- **Parent checkbox** (`<ui-checkbox parent>`, Base UI `parent`): checked when every value of `all-values` (default: the other checkboxes' values) is checked, mixed when some are; activating it checks them all, or clears them all when all were checked. It has no value of its own.
- **Form**: with a `name` the group submits `name=value` once per checked value; its checkboxes need no name. `required`: invalid (`valueMissing`) until one is checked.
- **disabled** reaches every checkbox (a disabled `ui-fieldset` or `<fieldset>` around the group does the same).
- **Naming**: a wrapping `ui-field` label (`aria-labelledby`; a label press focuses the first checkbox), a `ui-fieldset` legend, or `label` (`aria-label`). The host is `role=group`.
- **orientation**: `vertical` (default) or `horizontal` (a wrapping row).

React: `<CheckboxGroup name="channels" defaultValue={['email']} onValueChange={(values, { reason, event }) => …}><Checkbox parent>All</Checkbox><Checkbox value="email">Email</Checkbox>…</CheckboxGroup>`. The checkboxes are native checkboxes that take the group's name (the parent none), checked state and disabled from context. The parent covers `allValues`, or else the member checkboxes, which register their values on mount (so pass `allValues` for server markup that shows the parent's state).

## Anatomy

### Both forms

Like Base UI's, the group is a single part: a host around its checkboxes.

```html
<ui-checkbox-group value="email" orientation="horizontal">
  <ui-checkbox value="email">Email</ui-checkbox>
  <ui-checkbox value="push">Push</ui-checkbox>
</ui-checkbox-group>
```

```tsx
<CheckboxGroup defaultValue={['email']} orientation="horizontal">
  <Checkbox.Root value="email"><Checkbox.Indicator />Email</Checkbox.Root>
  <Checkbox value="push">Push</Checkbox>
</CheckboxGroup>
```

### Generated

```html
<ui-checkbox-group role="group" data-orientation="vertical" data-filled class="ui-checkbox-group__root ui-checkbox-group__root--orientation_vertical">
  <ui-checkbox parent role="checkbox" aria-checked="mixed" data-indeterminate …>…</ui-checkbox>
  <ui-checkbox role="checkbox" aria-checked="true" data-checked …>…</ui-checkbox>
</ui-checkbox-group>
```

React: `<div role="group" data-ui="checkbox-group" data-orientation="vertical" class="ui-checkbox-group__root …">` around `<label data-ui="checkbox">` hosts with their native checkboxes.

## States

The host carries the field state (`data-disabled`, `data-required`, `data-valid` / `data-invalid` once shown, `data-dirty`, `data-touched`, `data-filled` when a value is checked, `data-focused`) and `data-orientation`; each checkbox its own `data-checked` / `data-unchecked` / `data-indeterminate` (the parent) and field state. The group draws nothing for them.

**Card choices** (`variant="card"`, React `variant="card"`): each checkbox is a card surface holding any content (a plan name, a price, a description), and the whole card is the choice. The card-md level: padding 4u − B (× density), the card radius (padding × min(1, s), × the theme's `radius-card`), the card fill with a 1px border-role stroke; checked: the primary-subtle fill and a 2px primary stroke. Cards sit the collection gap apart; horizontal cards share the row (at least 48u each) and wrap. The checkbox's role, keys and form value are unchanged; its children are presentational to assistive technology, so keep the name in the first line (`resolveChoiceCard`). For a list of choices inside one card, use an attached listbox (`inset="none"`).

## Geometry

Family `choice-group` (`resolveChoiceGroup`, the recipe shared with the radio group): 6u checkbox rows 1u apart (a 7u pitch); horizontal 4u between checkboxes and 1u between wrapped lines. The `gap` attribute (in u) replaces the gap along the direction. No padding, border or radius.
