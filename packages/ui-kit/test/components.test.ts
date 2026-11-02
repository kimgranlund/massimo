import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('../components/button/button.element.ts');
await import('../components/input/input.element.ts');
await import('../components/listbox/listbox.element.ts');
await import('../components/select/select.element.ts');

test('ui-button: role, focus, author classes and label kept', async () => {
  const b = document.createElement('ui-button');
  b.className = 'mine';
  b.textContent = 'Save';
  document.body.append(b);
  assert.equal(b.getAttribute('role'), 'button');
  assert.equal(b.getAttribute('tabindex'), '0');
  b.loading = true; await tick();
  assert.equal(b.getAttribute('aria-busy'), 'true');
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
  assert.equal(ed.dataset.part, 'control');
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

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(e);
  return e;
};
const build = (tag: string, html: string) => {
  const el = document.createElement(tag) as any;
  el.innerHTML = html;
  document.body.append(el);
  return el;
};
const OPTS = '<ui-option value="a">Apple</ui-option><ui-option value="b" disabled>Banana</ui-option><ui-option value="c">Cherry</ui-option><ui-option value="d">Date</ui-option>';

test('ui-listbox: arrows skip disabled, selection follows focus, events and form value', async () => {
  const lb = build('ui-listbox', OPTS);
  await tick();
  assert.equal(lb.getAttribute('role'), 'listbox');
  assert.equal(lb.querySelector(NATIVE), null);
  let changes = 0;
  lb.addEventListener('change', () => changes++);
  lb.dispatchEvent(new Event('focus'));
  key(lb, 'ArrowDown'); await tick();
  assert.equal(lb.value, 'c', 'skipped disabled Banana');
  assert.equal(lb.getAttribute('aria-activedescendant'), lb.options[2].id);
  assert.equal(lb.options[2].getAttribute('aria-selected'), 'true');
  assert.equal(lb.options[0].getAttribute('aria-selected'), 'false');
  key(lb, 'End'); await tick();
  assert.equal(lb.value, 'd');
  key(lb, 'a'); await tick();
  assert.equal(lb.value, 'a', 'typeahead');
  assert.equal(changes, 3);
  assert.equal((lb.internals as any).value, 'a');
  lb.options[1].click(); await tick();
  assert.equal(lb.value, 'a', 'disabled option not selectable');
  lb.remove();
});

test('ui-segmented: horizontal arrows, RTL-agnostic vertical keys ignored', async () => {
  const sg = build('ui-segmented', '<ui-option>Day</ui-option><ui-option>Week</ui-option><ui-option>Month</ui-option>');
  sg.setAttribute('value', 'Day');
  await tick();
  assert.equal(sg.getAttribute('aria-orientation'), 'horizontal');
  sg.dispatchEvent(new Event('focus'));
  key(sg, 'ArrowRight'); await tick();
  assert.equal(sg.value, 'Week', 'value defaults to label');
  const down = key(sg, 'ArrowDown');
  assert.equal(down.defaultPrevented, false);
  assert.equal(sg.value, 'Week');
  sg.remove();
});

test('ui-select: options move into popup; open, move, commit, cancel', async () => {
  const sel = build('ui-select', OPTS);
  sel.label = 'Fruit';
  await tick();
  const trigger = sel.trigger!;
  assert.equal(sel.querySelector(NATIVE), null);
  assert.equal(sel.options.length, 4);
  assert.equal(sel.popup!.contains(sel.options[0]), true);
  assert.equal(trigger.getAttribute('role'), 'combobox');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(sel.querySelector('[data-part=value]')!.textContent, 'Select…');

  key(trigger, 'ArrowDown'); await tick();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(trigger.getAttribute('aria-activedescendant'), sel.options[0].id);
  key(trigger, 'ArrowDown'); await tick();
  assert.equal(trigger.getAttribute('aria-activedescendant'), sel.options[2].id, 'skips disabled');
  key(trigger, 'Enter'); await tick();
  assert.equal(sel.value, 'c');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(sel.querySelector('[data-part=value]')!.textContent, 'Cherry');

  key(trigger, ' '); await tick();
  key(trigger, 'Home'); await tick();
  key(trigger, 'Escape'); await tick();
  assert.equal(sel.value, 'c', 'Escape cancels');
  assert.equal(sel.open, false);

  key(trigger, 'd'); await tick();
  assert.equal(sel.open, true, 'typing opens on the match');
  sel.options[3].click(); await tick();
  assert.equal(sel.value, 'd');
  assert.equal(sel.open, false);
  sel.remove();
});

test('ui-select: outside pointerdown closes; required; reconnect keeps options', async () => {
  const sel = build('ui-select', OPTS);
  sel.required = true;
  await tick();
  sel.trigger!.click(); await tick();
  assert.equal(sel.open, true);
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await tick();
  assert.equal(sel.open, false);
  assert.equal(sel.validity.valueMissing, true);
  sel.remove();
  document.body.append(sel); await tick();
  assert.equal(sel.options.length, 4, 'options survive reconnect');
  sel.innerHTML; // eslint-ignore
  sel.append(Object.assign(document.createElement('ui-option'), { textContent: 'Elderberry' }));
  await tick(); await tick();
  assert.equal(sel.options.length, 5, 'late options are adopted');
  sel.remove();
});
