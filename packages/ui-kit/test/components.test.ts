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

test('ui-input: label wiring, typing, error state', async () => {
  const el = document.createElement('ui-input');
  el.label = 'Email';
  el.description = 'Work address';
  document.body.append(el);
  const input = el.querySelector('input')!;
  const label = el.querySelector('label')!;
  assert.equal(label.htmlFor, input.id);
  assert.equal(input.getAttribute('aria-describedby'), `${input.id}-desc`);
  assert.ok(input.classList.contains('ui-input__control--size_md'));

  input.value = 'kim@example.com';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(el.value, 'kim@example.com');

  el.error = 'Taken'; await tick();
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(input.getAttribute('aria-describedby'), `${input.id}-desc ${input.id}-error`);
  assert.equal(el.querySelector('[role=alert]')!.textContent, 'Taken');
  assert.equal(el.querySelector('input'), input, 'input node survives re-render');
  el.remove();
});
