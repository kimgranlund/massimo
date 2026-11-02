import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('../components/button/button.element.ts');
await import('../components/input/input.element.ts');

test('ui-button: role, focus, recipe classes, author classes kept', async () => {
  const b = document.createElement('ui-button');
  b.className = 'mine';
  b.textContent = 'Save';
  document.body.append(b);
  assert.equal(b.getAttribute('role'), 'button');
  assert.equal(b.getAttribute('tabindex'), '0');
  assert.ok(b.classList.contains('ui-button--variant_solid'));
  b.variant = 'ghost'; await tick();
  assert.ok(b.classList.contains('ui-button--variant_ghost'));
  assert.ok(!b.classList.contains('ui-button--variant_solid'));
  assert.ok(b.classList.contains('mine'));
  assert.equal(b.textContent, 'Save', 'authored label kept');
  b.remove();
});

test('ui-button: Enter activates, disabled blocks clicks', async () => {
  const b = document.createElement('ui-button');
  document.body.append(b);
  let clicks = 0;
  b.addEventListener('click', () => clicks++);
  b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(clicks, 1);
  b.disabled = true; await tick();
  assert.equal(b.getAttribute('aria-disabled'), 'true');
  assert.equal(b.getAttribute('tabindex'), '-1');
  b.click();
  b.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  assert.equal(clicks, 1);
  b.remove();
});

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const type = (el: HTMLElement, text: string) => {
  const ed = (el as any).editor as HTMLElement;
  ed.textContent = text;
  ed.dispatchEvent(new Event('input', { bubbles: true }));
};

test('ui-input: zero native form elements, ARIA wiring', async () => {
  const el = document.createElement('ui-input');
  el.label = 'Email';
  el.description = 'Work address';
  el.placeholder = 'you@example.com';
  document.body.append(el);
  assert.equal(el.querySelector(NATIVE), null);
  const ed = el.editor!;
  const label = el.children[0];
  assert.equal(ed.getAttribute('role'), 'textbox');
  assert.equal(ed.getAttribute('contenteditable'), 'plaintext-only');
  assert.equal(ed.getAttribute('aria-labelledby'), label.id);
  assert.equal(ed.getAttribute('aria-describedby'), `${ed.id}-desc`);
  assert.equal(ed.getAttribute('aria-placeholder'), 'you@example.com');
  assert.ok(ed.classList.contains('ui-input__control--size_md'));
  el.remove();
});

test('ui-input: typing updates value and form value; editor node and text survive re-render', async () => {
  const el = document.createElement('ui-input');
  el.name = 'email';
  document.body.append(el);
  const ed = el.editor!;
  type(el, 'kim@example.com');
  await tick();
  assert.equal(el.value, 'kim@example.com');
  assert.equal((el.internals as any).value, 'kim@example.com');
  assert.equal(el.editor, ed);
  el.value = 'set@example.com'; await tick();
  assert.equal(ed.textContent, 'set@example.com');
  type(el, 'line one\nline two'); await tick();
  assert.equal(el.value, 'line one line two');
  el.remove();
});

test('ui-input: required error waits for blur, then shows; author error shows at once', async () => {
  const el = document.createElement('ui-input');
  el.required = true;
  document.body.append(el);
  const ed = el.editor!;
  assert.equal(el.validity.valid, false, 'invalid from the start');
  assert.equal(ed.getAttribute('aria-invalid'), null, 'but not shown before interaction');
  ed.dispatchEvent(new Event('blur'));
  await tick();
  assert.equal(ed.getAttribute('aria-invalid'), 'true');
  assert.ok(el.hasAttribute('data-user-invalid'));
  assert.equal(el.children[3].textContent, 'Fill in this field.');
  type(el, 'x'); await tick();
  assert.equal(el.validity.valid, true);
  assert.equal(ed.getAttribute('aria-invalid'), null);

  const other = document.createElement('ui-input');
  other.error = 'Taken';
  document.body.append(other);
  assert.equal(other.editor!.getAttribute('aria-invalid'), 'true');
  assert.equal(other.children[3].getAttribute('role'), 'alert');
  el.remove(); other.remove();
});

test('ui-input: email, minlength and pattern validation; submit attempt reveals errors', async () => {
  const el = document.createElement('ui-input');
  el.type = 'email';
  document.body.append(el);
  type(el, 'nope'); await tick();
  assert.equal(el.validity.typeMismatch, true);
  el.type = 'text'; el.minlength = 5; await tick();
  assert.equal(el.validity.tooShort, true);
  el.minlength = null; el.pattern = '[a-z]+-\\d+'; await tick();
  assert.equal(el.validity.patternMismatch, true);
  assert.equal(el.editor!.getAttribute('aria-invalid'), null);
  el.checkValidity(); await tick();  // fires 'invalid', as a blocked submit does
  assert.equal(el.editor!.getAttribute('aria-invalid'), 'true');
  el.remove();
});

test('ui-input: Enter submits the form instead of adding a line; reset restores default', async () => {
  const form = document.createElement('form');
  let submits = 0;
  (form as any).requestSubmit = () => submits++;
  const el = document.createElement('ui-input');
  el.setAttribute('value', 'start');
  form.append(el);
  document.body.append(form);
  await tick();
  const e = new (globalThis as any).window.InputEvent('beforeinput', { inputType: 'insertParagraph', cancelable: true, bubbles: true });
  el.editor!.dispatchEvent(e);
  assert.equal(e.defaultPrevented, true);
  assert.equal(submits, 1);
  type(el, 'changed'); await tick();
  el.formResetCallback(); await tick();
  assert.equal(el.value, 'start');
  assert.equal(el.editor!.textContent, 'start');
  form.remove();
});

test('ui-input: password is masked and blocks copy; disabled is not editable', async () => {
  const el = document.createElement('ui-input');
  el.type = 'password';
  document.body.append(el);
  const ed = el.editor!;
  assert.ok(ed.hasAttribute('data-secret'));
  assert.equal(ed.getAttribute('spellcheck'), 'false');
  const copy = new Event('copy', { cancelable: true });
  ed.dispatchEvent(copy);
  assert.equal(copy.defaultPrevented, true);
  el.disabled = true; await tick();
  assert.equal(ed.getAttribute('contenteditable'), 'false');
  assert.equal(ed.getAttribute('tabindex'), '-1');
  assert.equal((el.internals as any).value, null, 'disabled submits nothing');
  el.remove();
});

test('fieldset-disabled ui-button blocks activation', async () => {
  const b = document.createElement('ui-button');
  document.body.append(b);
  let clicks = 0;
  b.addEventListener('click', () => clicks++);
  b.formDisabledCallback(true); await tick();
  b.click();
  assert.equal(clicks, 0);
  assert.equal(b.getAttribute('aria-disabled'), 'true');
  assert.equal(b.querySelector(NATIVE), null);
  b.remove();
});
