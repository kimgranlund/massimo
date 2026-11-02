# Field

`ui-field`, `ui-field-grid`. API, defaults and avoidance guidance: [field.manifest.json](field.manifest.json) (`npm run registry -- component:field`). Examples: [field.examples.json](field.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-field`: name one control with a visible label; show a control's unit and current value beside it in a property row.
- `ui-field-grid`: align the labels, controls and readouts of a column of inline fields.

## Usage

```html
<ui-field-grid>
  <h2>Geometry</h2>
  <ui-field layout="inline" label="Unit" unit="px" readout="4.5">
    <ui-range min="2" max="12" step="0.5" value="4.5"></ui-range>
  </ui-field>
  <ui-field layout="inline" label="Icons">
    <ui-select value="phosphor"><ui-option value="phosphor">Phosphor</ui-option></ui-select>
  </ui-field>
</ui-field-grid>

<ui-field label="Volume" unit="%" readout="40" description="Applies to every output.">
  <ui-range value="40"></ui-range>
</ui-field>
```

`layout="stacked"` (default) puts the label above the control, like ui-input's own label; `layout="inline"` puts it beside: `[label … unit] [control] [readout]`, with the description under the control. The readout is text the application keeps in step with the control (`readout` attribute, or a `slot="readout"` child for markup); without one the control takes its column.

React: `<Field label="Unit" unit="px" readout={4.5} layout="inline">{(ids) => <Range {...ids} />}</Field>` inside `<FieldGrid>`. The render function receives `id` (for the native `<label htmlFor>`), `aria-labelledby` and `aria-describedby`; plain children render as they are.

## Labelling

The field's label names its control, so the control needs no label (and no `hide-label`) of its own:

- A control whose host carries the role (ui-range, ui-switch, ui-checkbox, ui-segmented, ui-listbox, ui-button, ui-palette) gets `aria-labelledby` = the label text id and the unit id ("Unit px"), and `aria-describedby` = the description id.
- ui-input and ui-select carry the role inside (editor, trigger), so the field sets their `labelledby` / `describedby` properties and they forward the ids there (the select also names its popup). Their own `label` wins when set; their own description and error come first in `aria-describedby`.
- A plain wrapper (a div holding two selects) is not labelled. Give the field an `id` and let each inner control list the field's label id with its own caption: `<ui-select labelledby="pad-field-label head-gap">` reads "card-md Gap".

A press on the label toggles a checkbox, switch or radio and focuses any other control, as a native `<label>` would. The field has no role and is not form-associated; the control submits its own value.

## Anatomy

The authored control stays a direct child (React keeps owning it); the field adds its parts as siblings and the recipe places every child by part, so DOM order does not matter:

```
[label: [contents] [suffix = unit]] [control] [readout]
                                    [description]
```

- `part:field-label` `:scope > [data-part=label]`: the label row; text and unit, unit at the end.
- `part:field-text` `:scope > [data-part=label] > [data-part=contents]`: label text (label role, fg.muted); truncates in a narrow column.
- `part:field-unit` `:scope > [data-part=label] > [data-part=suffix]`: unit suffix, fg.subtle, never truncated.
- `part:field-readout` `:scope > [data-part=readout]`: tabular figures in the numeric voice, fg.muted, end-aligned.
- `part:field-description` `:scope > [data-part=description]`: caption role.

A required control adds ` *` after the label text; a disabled one fades the label.

## Field grid

`ui-field-grid` defines three columns: label (content-sized up to 40% of the grid), control (fills), readout (the widest readout, at least 10u). Each `ui-field` child spans them with `grid-template-columns: subgrid`, so every label, control and readout lines up with its neighbours across groups. Any other child spans every column; headings (`h1`–`h6`, `role=heading`) take the group kicker role with 4u above all but the first, so one grid holds several groups.

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

`ui-field` / Field sets no state of its own: it reads its control's `data-disabled` (the label fades) and `data-required` (the marker) with `:has()`, and a bare native control's `:disabled` / `[required]`.

## Geometry and appearance

Geometry family `field-row` ([geometry-families.json](../../contracts/geometry-families.json)): Panda spacing and sizes tokens in u (column and row gap 2u in the grid; stacked label gap 1.5u; readout at least 10u); the controls keep their own geometry. Styles: the slot recipes in [field.recipe.ts](field.recipe.ts), applied by the web components and the React renderers alike.

## Renderers and verification

- webComponent: completed (`./field.element.ts`)
- react: completed (`./field.react.tsx`)
- html: in_progress

React props: `npm run registry -- --assembly component:field` (under `react`).

Checks and their latest run: [verification/field.verification.json](verification/field.verification.json).
