# Form

`ui-form`. API, defaults and avoidance guidance: [form.manifest.json](form.manifest.json) (`npm run registry -- component:form`). Examples: [form.examples.json](form.examples.json). Contract: [components.json](../../contracts/components.json). Base UI: [Form](https://base-ui.com/react/components/form).

## Intent

Submit a set of fields together, show server errors on the fields they name, and choose when field errors show.

## Usage

```html
<ui-form id="signup">
  <ui-input name="email" label="Email" type="email" required></ui-input>
  <ui-field label="Plan">
    <ui-radio-group name="plan" value="pro" orientation="horizontal">
      <ui-radio value="free">Free</ui-radio><ui-radio value="pro">Pro</ui-radio>
    </ui-radio-group>
  </ui-field>
  <ui-button type="submit" variant="primary">Sign up</ui-button>
</ui-form>
<script type="module">
  signup.addEventListener('formsubmit', async (e) => {
    const res = await fetch('/signup', { method: 'POST', body: JSON.stringify(e.detail.values) });
    if (!res.ok) signup.errors = await res.json(); // { email: 'Already registered' }
  });
</script>
```

No native `<form>` (the kit's rule for web components), inside or around it: the host is `role=form` and the **form owner** of every kit form control inside that has no native form of its own. A `ui-button type=submit`, Enter in a `ui-input` or `requestSubmit()` submits it; `ui-button type=reset` or `reset()` resets it.

- **Submit** validates every control: the invalid ones fire `invalid` and show their errors, the first one takes focus, and nothing is submitted. When all pass, `formsubmit` fires with `{ values, submitter, reason: 'none', event }` (Base UI `onFormSubmit(values, details)`): the values by name, as `FormData` would submit them (disabled controls and empty choices left out; a repeated name, or a checkbox group's values, is an array). `data-submitted` is set from the first attempt until reset.
- **errors** (Base UI Form `errors`): `{ name: message | message[] }`, an object or its JSON in the `errors` attribute, typically from a server. Each control of that name gets it as its form error: invalid at once (`data-invalid`), shown in its own error part (`ui-input`, `ui-select`) or, for any other control, in the error part of its `ui-field` (wired into its `aria-describedby`). A change to that control clears it; a new submit or `reset()` clears them all.
- **validation-mode** (Base UI `validationMode`, its names): `onSubmit` (the default: a control's own errors wait for a submit attempt, then follow every change), `onBlur` (they show when the control loses focus: the kit's behavior outside a form), `onChange` (on every change).
- `values()`, `checkValidity()`, `reportValidity()`, `validate(name?)` (Base UI `actions.validate`) and `elements` (the owned controls).

A native `<form>` around the controls stays their owner (native submit, reset and validation), so do not nest a `ui-form` inside one.

React: `<Form errors validationMode onFormSubmit actionsRef>`, one part as in Base UI: a native `<form noValidate>` that runs the same validation on submit (constraint validation: each invalid control fires `invalid`, its host shows the error, the first takes focus) and calls `onFormSubmit(values, { reason: 'none', event })` with the FormData as an object (and prevents the native submit). `Input` and `Select` inside show their name's error; a `Field` given `name` shows it in `Field.Error` (for choices and groups); a change event from a control clears its name's error. `actionsRef.current.validate(name?)`.

## Anatomy

### Both forms

```html
<ui-form validation-mode="onBlur" errors='{"email":"Already registered"}'>
  <ui-input name="email" label="Email"></ui-input>
  <ui-button type="submit">Save</ui-button>
</ui-form>
```

```tsx
<Form validationMode="onBlur" errors={{ email: 'Already registered' }} onFormSubmit={(values) => save(values)}>
  <Input name="email" label="Email" />
  <Button type="submit">Save</Button>
</Form>
```

### Generated

```html
<ui-form role="form" data-submitted class="ui-form__root">…</ui-form>
```

React: `<form data-ui="form" novalidate data-submitted class="ui-form__root">…</form>`.

No parts: the form is one element (Base UI Form). The `className` function receives `{ submitted }`.

## States

`data-submitted` (ours; Base UI Form has no state): a submit was attempted, until reset. The controls inside carry their own field state (`data-invalid` for a form error).

## Geometry

Family `form` (`resolveForm`): the fields, fieldsets and actions stack with the collection gap of the container ladder (theme `gap-collection`, 2u by default; the `gap` attribute wins). No padding, border or radius: put the form in a card for a surface.
