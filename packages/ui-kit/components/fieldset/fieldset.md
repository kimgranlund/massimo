# Fieldset

`ui-fieldset`. API, defaults and avoidance guidance: [fieldset.manifest.json](fieldset.manifest.json) (`npm run registry -- component:fieldset`). Examples: [fieldset.examples.json](fieldset.examples.json). Contract: [components.json](../../contracts/components.json). Base UI: [Fieldset](https://base-ui.com/react/components/fieldset).

## Intent

Name a set of related fields with a legend, and disable them together.

## Usage

```html
<ui-fieldset legend="Billing address">
  <ui-input name="street" label="Street"></ui-input>
  <ui-input name="city" label="City"></ui-input>
  <ui-field label="Plan">
    <ui-radio-group name="plan" value="pro" orientation="horizontal">
      <ui-radio value="free">Free</ui-radio><ui-radio value="pro">Pro</ui-radio>
    </ui-radio-group>
  </ui-field>
</ui-fieldset>
```

No native `<fieldset>` or `<legend>` (the kit's rule for web components): the host is `role=group`, named by its legend part through `aria-labelledby`. It is not form-associated; the controls inside submit their own values.

- **disabled** reaches every kit form control inside, at any depth, as a native `<fieldset disabled>` would: a control's `isDisabled` reads the nearest disabling container (`ui-fieldset`, `ui-radio-group`, `ui-checkbox-group`), so it shows `data-disabled`, ignores input and submits nothing. A nested fieldset is disabled with its outer one. The host and the legend carry `data-disabled`; the legend fades, the controls fade themselves.
- **legend**: the `legend` property fills a generated legend part (hidden when empty), or author one as `[data-part=legend]` (a heading keeps its heading semantics); its text seeds `legend`.

React: `<Fieldset legend="Billing address" disabled>…</Fieldset>`, or `Fieldset.Root` with `Fieldset.Legend`. The Root is a native `<fieldset>` (the recipe resets its user-agent margin, padding, border and minimum width), so it disables the native controls inside; it also hands `disabled` to every kit host inside through context, so their `data-disabled` matches the web component's.

## Anatomy

### Both forms

```html
<ui-fieldset disabled>
  <div data-part="legend">Billing address</div>
  <ui-input label="Street"></ui-input>
</ui-fieldset>
```

```tsx
<Fieldset.Root disabled>
  <Fieldset.Legend>Billing address</Fieldset.Legend>
  <Input label="Street" />
</Fieldset.Root>
```

### Generated

```html
<ui-fieldset role="group" aria-labelledby="fieldset-1-legend" data-disabled class="ui-fieldset__root">
  <div data-part="legend" id="fieldset-1-legend" data-disabled class="ui-fieldset__legend">Billing address</div>
  …
</ui-fieldset>
```

React: `<fieldset data-ui="fieldset" aria-labelledby="…" disabled data-disabled class="ui-fieldset__root"><div data-part="legend" id="…" data-disabled class="ui-fieldset__legend">…</div>…</fieldset>`.

Parts: `part:fieldset-legend` `:scope > [data-part=legend]` (Base UI Fieldset.Legend).

## States

`data-disabled` on the host and the legend (Base UI names); the controls inside carry their own field state.

## Geometry

Family `fieldset` (`resolveFieldset`): the legend and the fields stack with the collection gap of the container ladder (theme `gap-collection`, 2u by default; the `gap` attribute wins). No padding, border or radius: the fields keep their own edges; put the fieldset in a card for a surface. The legend is the title type role.
