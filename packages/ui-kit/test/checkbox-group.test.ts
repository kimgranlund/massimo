// ui-checkbox-group and React CheckboxGroup: the group owns the value array, sets its checkboxes'
// checked state, fires change / input with { value, reason, event } (its checkboxes then fire none),
// drives a parent checkbox (all / mixed / none), passes disabled down, submits name=value per value,
// resets; React renders the same anatomy, classes and data-* and calls onValueChange.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

await import('../components/checkbox-group/checkbox-group.element.ts');
const { CheckboxGroup } = await loadTsx(new URL('../components/checkbox-group/checkbox-group.react.tsx', import.meta.url));
const { Checkbox } = await loadTsx(new URL('../components/choice/choice.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const BOXES = '<ui-checkbox value="email">Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox><ui-checkbox value="sms">SMS</ui-checkbox>';
async function mount(html: string) {
  const d = document.createElement('div');
  d.innerHTML = html;
  document.body.append(d);
  await tick(); await tick();
  return d;
}
const state = (g: Element) => [...g.querySelectorAll('ui-checkbox')].map((c: any) => (c.indeterminate ? 'mixed' : c.checked ? 'on' : 'off'));
const dataNames = (el: Element | null) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-part', 'data-size', 'data-mark'].includes(n)).sort();

test('ui-checkbox-group: group host, value checks the checkboxes, recipe classes, no native elements', async () => {
  const d = await mount(`<ui-checkbox-group label="Send to" value="email sms">${BOXES}</ui-checkbox-group>`);
  const g = d.firstElementChild as any;
  assert.equal(g.querySelector(NATIVE), null);
  assert.equal(g.getAttribute('role'), 'group');
  assert.equal(g.getAttribute('aria-label'), 'Send to');
  assert.deepEqual(g.value, ['email', 'sms'], 'the attribute becomes a list');
  assert.deepEqual(state(g), ['on', 'off', 'on']);
  assert.ok(g.classList.contains('ui-checkbox-group__root') && g.classList.contains('ui-checkbox-group__root--orientation_vertical'));
  g.value = ['push'];
  await tick();
  assert.deepEqual(state(g), ['off', 'on', 'off']);
  d.remove();
});

test('ui-checkbox-group: a press adds or removes a value; the group fires { value, reason, event }, the checkboxes none', async () => {
  const d = await mount(`<ui-checkbox-group>${BOXES}</ui-checkbox-group>`);
  const g = d.firstElementChild as any, [email, push] = g.querySelectorAll('ui-checkbox');
  const got: [string, any][] = [], fromBox: string[] = [];
  for (const t of ['input', 'change']) g.addEventListener(t, (e: CustomEvent) => { if (e.target === g) got.push([t, e.detail]); else fromBox.push(t); });
  push.click(); await tick();
  email.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })); await tick();
  assert.deepEqual(g.value, ['push', 'email'], 'in the order they were checked');
  push.click(); await tick();
  assert.deepEqual(g.value, ['email']);
  assert.deepEqual(got.filter(([t]) => t === 'change').map(([, x]) => [x.value, x.reason]), [[['push'], 'none'], [['push', 'email'], 'none'], [['email'], 'none']]);
  assert.ok(got[0][1].event instanceof Event);
  assert.deepEqual(fromBox, []);
  d.remove();
});

test('ui-checkbox-group: a parent checkbox shows all / mixed / none and sets every value', async () => {
  const d = await mount(`<ui-checkbox-group value="push"><ui-checkbox parent>All channels</ui-checkbox>${BOXES}</ui-checkbox-group>`);
  const g = d.firstElementChild as any, parent = g.querySelector('ui-checkbox[parent]');
  assert.deepEqual(state(g), ['mixed', 'off', 'on', 'off']);
  assert.equal(parent.getAttribute('aria-checked'), 'mixed');
  assert.ok(parent.hasAttribute('data-indeterminate'));
  parent.click(); await tick();
  assert.deepEqual(g.value, ['email', 'push', 'sms'], 'mixed → every value');
  assert.deepEqual(state(g), ['on', 'on', 'on', 'on']);
  parent.click(); await tick();
  assert.deepEqual(g.value, []);
  assert.deepEqual(state(g), ['off', 'off', 'off', 'off']);
  g.allValues = ['email', 'push'];
  g.value = ['email', 'push'];
  await tick();
  assert.equal(parent.checked, true, 'allValues decides what the parent covers');
  d.remove();
});

test('ui-checkbox-group: disabled reaches the checkboxes; name submits once per value; defaults and reset', async () => {
  const d = await mount(`<ui-checkbox-group disabled value="email">${BOXES}</ui-checkbox-group>`);
  const g = d.firstElementChild as any, push = g.querySelectorAll('ui-checkbox')[1];
  assert.equal(push.isDisabled, true);
  assert.ok(push.hasAttribute('data-disabled') && g.hasAttribute('data-disabled'));
  push.click(); await tick();
  assert.deepEqual(g.value, ['email']);
  d.remove();

  const f = await mount(`<ui-checkbox-group name="ch"><ui-checkbox value="email" checked>Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox><ui-checkbox value="sms" checked>SMS</ui-checkbox></ui-checkbox-group>`);
  const fg = f.firstElementChild as any;
  assert.deepEqual(fg.value, ['email', 'sms'], 'checkboxes authored checked set the default');
  assert.deepEqual([...fg.internals.value.getAll('ch')], ['email', 'sms']);
  assert.equal(fg.querySelector('ui-checkbox').name, '', 'the checkboxes have no name: they submit nothing');
  assert.ok(!fg.hasAttribute('data-dirty'));
  fg.querySelectorAll('ui-checkbox')[1].click(); await tick();
  assert.ok(fg.hasAttribute('data-dirty') && fg.hasAttribute('data-touched') && fg.hasAttribute('data-filled'));
  fg.formResetCallback(); await tick();
  assert.deepEqual(fg.value, ['email', 'sms']);
  assert.ok(!fg.hasAttribute('data-dirty'));
  fg.required = true; fg.value = []; await tick();
  assert.equal(fg.checkValidity(), false);
  f.remove();
});

test('React CheckboxGroup: group host with the same classes; checkboxes share the name; parent from allValues', () => {
  const out = renderToStaticMarkup(h(CheckboxGroup, { name: 'ch', defaultValue: ['push'], allValues: ['email', 'push'], label: 'Send to' },
    h(Checkbox, { parent: true }, 'All'), h(Checkbox, { value: 'email' }, 'Email'), h(Checkbox, { value: 'push' }, 'Push')));
  assert.match(out, /^<div role="group" data-ui="checkbox-group" aria-label="Send to"[^>]* class="ui-checkbox-group__root ui-checkbox-group__root--orientation_vertical ui-checkbox-group__root--variant_list"/);
  assert.equal((out.match(/name="ch"/g) ?? []).length, 2, 'the parent has no name');
  assert.match(out, /<label data-ui="checkbox" data-indeterminate=""/, 'the parent is mixed');
  assert.match(out, /name="ch" checked="" value="push"/);
});

test('state parity: the group host and its checkboxes carry the same data-* in both renderers', async () => {
  const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
  const cases: [string, any][] = [
    [`<ui-checkbox-group value="push"><ui-checkbox parent>All</ui-checkbox>${BOXES}</ui-checkbox-group>`, { defaultValue: ['push'], allValues: ['email', 'push', 'sms'] }],
    [`<ui-checkbox-group disabled required orientation="horizontal" value="email push sms"><ui-checkbox parent>All</ui-checkbox>${BOXES}</ui-checkbox-group>`, { disabled: true, required: true, orientation: 'horizontal', defaultValue: ['email', 'push', 'sms'], allValues: ['email', 'push', 'sms'] }],
  ];
  for (const [markup, props] of cases) {
    const d = await mount(markup);
    const a = d.firstElementChild!;
    const box = document.createElement('div');
    box.innerHTML = renderToStaticMarkup(h(CheckboxGroup, props, h(Checkbox, { parent: true }, 'All'), h(Checkbox, { value: 'email' }, 'Email'), h(Checkbox, { value: 'push' }, 'Push'), h(Checkbox, { value: 'sms' }, 'SMS')));
    const b = box.firstElementChild!;
    assert.deepEqual(dataNames(a), dataNames(b), `host: ${markup}`);
    for (const n of dataNames(a)) assert.ok(contract.components['ui-checkbox-group'].host.includes(n), `${n} is listed for ui-checkbox-group`);
    const ca = [...a.querySelectorAll('ui-checkbox')], cb = [...b.querySelectorAll('[data-ui=checkbox]')];
    ca.forEach((c, i) => assert.deepEqual(dataNames(c), dataNames(cb[i]), `checkbox ${i}: ${markup}`));
    d.remove();
  }
});

test('React CheckboxGroup: a press calls onValueChange(values, { reason: none, event }); the parent (registered members) sets all', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: [string[], any][] = [];
  await act(async () => root.render(h(CheckboxGroup, { defaultValue: ['email'], onValueChange: (v: string[], d: any) => calls.push([v, d]) },
    h(Checkbox, { parent: true }, 'All'), h(Checkbox, { value: 'email' }, 'Email'), h(Checkbox, { value: 'push' }, 'Push'))));
  const inputs = box.querySelectorAll('input');
  assert.equal(inputs[0].indeterminate, true, 'one of two: mixed');
  await act(async () => { inputs[2].click(); });
  assert.deepEqual(calls.map(([v, d]) => [v, d.reason]), [[['email', 'push'], 'none']]);
  assert.equal(inputs[0].checked, true, 'all checked: the parent is checked');
  await act(async () => { inputs[0].click(); });
  assert.deepEqual(calls.at(-1)![0], []);
  assert.deepEqual([...inputs].map((i) => i.checked), [false, false, false]);
  await act(async () => root.unmount());
  box.remove();
});
