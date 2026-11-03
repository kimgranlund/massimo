// ui-form and React Form (Base UI Form): the kit form owner with no native form, a submit that
// validates every control (errors shown, the first invalid focused) and fires formsubmit with the
// values by name; errors by name shown at once on the named controls (their own error part or their
// ui-field's) and cleared on change; validation modes onSubmit / onBlur / onChange; reset. React:
// a native form with the same classes and data-*, onFormSubmit(values, details), errors by name.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

await import('../components/form/form.element.ts');
await import('../components/field/field.element.ts');
await import('../components/input/input.element.ts');
await import('../components/btg/btg.element.ts');
await import('../components/button/button.element.ts');
await import('../components/radio-group/radio-group.element.ts');
await import('../components/checkbox-group/checkbox-group.element.ts');
await import('../components/fieldset/fieldset.element.ts');
const { Form } = await loadTsx(new URL('../components/form/form.react.tsx', import.meta.url));
const { Input } = await loadTsx(new URL('../components/input/input.react.tsx', import.meta.url));
const { Field } = await loadTsx(new URL('../components/field/field.react.tsx', import.meta.url));
const { Listbox, Option } = await loadTsx(new URL('../components/listbox/listbox.react.tsx', import.meta.url));
const { Palette, Swatch } = await loadTsx(new URL('../components/color/color.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
async function mount(html: string) {
  const d = document.createElement('div');
  d.innerHTML = html;
  document.body.append(d);
  await tick(); await tick();
  return d;
}
const blur = (el: Element) => el.dispatchEvent(new Event('focusout', { bubbles: true }));
const changed = (el: Element) => el.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: {} }));
const errorText = (el: Element) => (el.querySelector(':scope > [data-part=error]') as HTMLElement | null)?.textContent ?? '';
const dataNames = (el: Element | null) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-part', 'data-size'].includes(n)).sort();

const FORM = `<ui-form>
  <ui-input name="email" label="Email" required></ui-input>
  <ui-fieldset legend="Plan"><ui-field label="Plan"><ui-radio-group name="plan" value="pro"><ui-radio value="free">Free</ui-radio><ui-radio value="pro">Pro</ui-radio></ui-radio-group></ui-field></ui-fieldset>
  <ui-checkbox-group name="tags" value="a b"><ui-checkbox value="a">A</ui-checkbox><ui-checkbox value="b">B</ui-checkbox></ui-checkbox-group>
  <ui-button type="submit">Save</ui-button>
</ui-form>`;

test('ui-form: role=form host with the recipe classes, no native elements; it owns the kit controls inside', async () => {
  const d = await mount(FORM);
  const f = d.firstElementChild as any;
  assert.equal(f.querySelector(NATIVE), null);
  assert.equal(d.querySelector('form'), null, 'no native form around it either');
  assert.equal(f.getAttribute('role'), 'form');
  assert.ok(f.classList.contains('ui-form__root'));
  assert.deepEqual(f.elements.map((e: Element) => e.localName).filter((n: string) => n !== 'ui-radio' && n !== 'ui-checkbox'), ['ui-input', 'ui-radio-group', 'ui-checkbox-group', 'ui-button']);
  d.remove();
});

test('ui-form: a submit validates, shows errors, focuses the first invalid control; when valid it fires formsubmit with the values', async () => {
  const d = await mount(FORM);
  const f = d.firstElementChild as any, input = f.querySelector('ui-input'), button = f.querySelector('ui-button');
  const got: any[] = [];
  f.addEventListener('formsubmit', (e: CustomEvent) => got.push(e.detail));
  let focused: Element | null = null;
  input.focus = () => { focused = input; };
  assert.ok(!input.hasAttribute('data-invalid'), 'no error before a submit');
  button.click();
  await tick();
  assert.equal(got.length, 0, 'blocked');
  assert.equal(focused, input, 'the first invalid control takes focus');
  assert.ok(input.hasAttribute('data-invalid') && errorText(input) !== '', 'its error shows');
  assert.ok(f.hasAttribute('data-submitted'));
  input.value = 'a@b.co';
  await tick();
  button.click();
  await tick();
  assert.equal(got.length, 1);
  assert.deepEqual(got[0].values, { email: 'a@b.co', plan: 'pro', tags: ['a', 'b'] });
  assert.equal(got[0].reason, 'none');
  assert.equal(got[0].submitter, button);
  // A disabled fieldset's controls submit nothing (as FormData).
  f.querySelector('ui-fieldset').disabled = true;
  await tick();
  assert.deepEqual(f.values(), { email: 'a@b.co', tags: ['a', 'b'] });
  d.remove();
});

test('ui-form: errors by name show at once on the named controls and clear when that control changes', async () => {
  const d = await mount(FORM);
  const f = d.firstElementChild as any, input = f.querySelector('ui-input'), group = f.querySelector('ui-radio-group'), field = f.querySelector('ui-field');
  f.errors = { email: 'Already taken', plan: ['Not available', 'in your region'] };
  await tick();
  assert.equal(input.formError, 'Already taken');
  assert.ok(input.hasAttribute('data-invalid'));
  assert.equal(errorText(input), 'Already taken', 'ui-input shows it in its error part');
  assert.ok(group.hasAttribute('data-invalid'));
  assert.equal(errorText(field), 'Not available in your region', 'a group shows it in its field\'s error part');
  assert.ok(group.getAttribute('aria-describedby')?.includes(field.querySelector('[data-part=error]').id));
  assert.equal(f.checkValidity(), false, 'a form error makes the control invalid');
  changed(input);
  await tick();
  assert.equal(input.formError, '');
  assert.ok(!errorText(input).includes('taken'), 'a change clears it');
  assert.equal(group.formError, 'Not available in your region', 'other names keep theirs');
  // The errors attribute takes JSON.
  f.setAttribute('errors', '{"plan":"Pick another"}');
  await tick();
  assert.equal(errorText(field), 'Pick another');
  f.reset();
  await tick();
  assert.equal(group.formError, '');
  assert.ok(!f.hasAttribute('data-submitted'));
  d.remove();
});

test('ui-form: validation-mode decides when the controls\' own errors show (Base UI onSubmit, onBlur, onChange)', async () => {
  const d = await mount(['onSubmit', 'onBlur', 'onChange'].map((m) => `<ui-form validation-mode="${m}"><ui-input name="n" label="N" required></ui-input></ui-form>`).join(''));
  const [sub, onBlur, onChange] = [...d.children].map((f) => f.querySelector('ui-input') as any);
  for (const i of [sub, onBlur, onChange]) blur(i);
  await tick();
  assert.ok(!sub.hasAttribute('data-invalid'), 'onSubmit: a blur shows nothing');
  assert.ok(onBlur.hasAttribute('data-invalid'), 'onBlur: a blur shows the error');
  assert.ok(onChange.hasAttribute('data-invalid'), 'onChange: a blur shows it too');
  (d.children[0] as any).requestSubmit();
  await tick();
  assert.ok(sub.hasAttribute('data-invalid'), 'onSubmit: shown after a submit attempt');
  sub.value = 'x';
  await tick();
  assert.ok(sub.hasAttribute('data-valid'), 'then it re-validates on change');
  const d2 = await mount('<ui-form validation-mode="onChange"><ui-input name="n" label="N" minlength="3"></ui-input></ui-form>');
  const i2 = d2.querySelector('ui-input') as any;
  i2.value = 'ab';
  changed(i2);
  await tick();
  assert.ok(i2.hasAttribute('data-invalid'), 'onChange: the first change shows it');
  // Outside a ui-form the kit default stays onBlur.
  const d3 = await mount('<ui-input name="n" label="N" required></ui-input>');
  blur(d3.firstElementChild!);
  await tick();
  assert.ok(d3.firstElementChild!.hasAttribute('data-invalid'));
  d.remove(); d2.remove(); d3.remove();
});

test('React Form: a native form (noValidate) with the same classes; errors by name reach Input and a named Field', () => {
  const out = renderToStaticMarkup(h(Form, { errors: { email: 'Already taken', plan: 'Pick one' } },
    h(Input, { name: 'email', label: 'Email' }), h(Field, { label: 'Plan', name: 'plan' }, h('span', {}, 'x'))));
  assert.match(out, /^<form data-ui="form" novalidate="" class="ui-form__root">/i);
  assert.match(out, /<div data-ui="input"[^>]*data-invalid=""/);
  assert.match(out, /<p data-part="error"[^>]*>Already taken<\/p>/);
  assert.match(out, /<p data-part="error"[^>]*>Pick one<\/p>/);
  const plain = renderToStaticMarkup(h(Form, {}, h(Input, { name: 'email', label: 'Email' })));
  assert.doesNotMatch(plain, /data-invalid|data-part="error"/);
  assert.match(renderToStaticMarkup(h(Form, { className: (s: any) => (s.submitted ? 'on' : 'off'), gap: 3 })), /style="--ui-gap:3" class="ui-form__root off"/);
});

test('React Form: a form error on a Listbox or Palette shows on its host and a Listbox clears it on its next change', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const errors = { fruit: 'Out of stock', tint: 'Pick another' };
  await act(async () => root.render(h(Form, { errors },
    h(Field, { label: 'Fruit', name: 'fruit' }, h(Listbox, { name: 'fruit', label: 'Fruit' }, h(Option, { value: 'a' }, 'Apple'), h(Option, { value: 'b' }, 'Banana'))),
    h(Palette, { name: 'tint', label: 'Tint' }, h(Swatch, { color: '#f00' }), h(Swatch, { color: '#00f' })))));
  const lb = box.querySelector('[data-ui=listbox]')!;
  const pal = box.querySelector('[data-ui=palette]')!;
  assert.ok(lb.hasAttribute('data-invalid'));
  assert.ok(pal.hasAttribute('data-invalid'));
  assert.match(box.textContent ?? '', /Out of stock/);
  await act(async () => { (lb.querySelectorAll('[data-ui=option]')[1] as HTMLElement).click(); });
  assert.ok(!lb.hasAttribute('data-invalid'));
  assert.doesNotMatch(box.textContent ?? '', /Out of stock/);
  await act(async () => root.unmount());
  box.remove();
});

test('state parity: the form host carries the same data-* in both renderers', async () => {
  const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
  const d = await mount('<ui-form><ui-input name="a" label="A"></ui-input></ui-form>');
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(h(Form, {}, h(Input, { name: 'a', label: 'A' })));
  assert.deepEqual(dataNames(d.firstElementChild), dataNames(box.firstElementChild));
  (d.firstElementChild as any).requestSubmit();
  await tick();
  for (const n of dataNames(d.firstElementChild)) assert.ok(contract.components['ui-form'].host.includes(n), n);
  d.remove();
});
