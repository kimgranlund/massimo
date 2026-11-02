// ui-radio-group and React RadioGroup: the group owns the value, sets its radios' checked state,
// fires change / input with { value, reason, event } (its radios then fire none), keeps the radios'
// keyboard model inside the group, passes disabled and read-only down, validates required, submits
// one value, resets; React renders the same anatomy, classes and data-* and calls onValueChange.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

await import('../components/radio-group/radio-group.element.ts');
await import('../components/field/field.element.ts');
const { RadioGroup } = await loadTsx(new URL('../components/radio-group/radio-group.react.tsx', import.meta.url));
const { Radio } = await loadTsx(new URL('../components/choice/choice.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const RADIOS = '<ui-radio value="a">Apple</ui-radio><ui-radio value="b">Banana</ui-radio><ui-radio value="c">Cherry</ui-radio>';
async function mount(html: string) {
  const d = document.createElement('div');
  d.innerHTML = html;
  document.body.append(d);
  await tick(); await tick();
  return d;
}
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const checked = (g: Element) => [...g.querySelectorAll('ui-radio')].map((r: any) => r.checked);
const dataNames = (el: Element | null) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-part', 'data-size'].includes(n)).sort();

test('ui-radio-group: radiogroup host, value sets the radios, recipe classes, no native elements', async () => {
  const d = await mount(`<ui-radio-group label="Fruit" value="b">${RADIOS}</ui-radio-group>`);
  const g = d.firstElementChild as any;
  assert.equal(g.querySelector(NATIVE), null);
  assert.equal(g.getAttribute('role'), 'radiogroup');
  assert.equal(g.getAttribute('aria-label'), 'Fruit');
  assert.equal(g.getAttribute('data-orientation'), 'vertical');
  assert.deepEqual(checked(g), [false, true, false]);
  assert.ok(g.classList.contains('ui-radio-group__root') && g.classList.contains('ui-radio-group__root--orientation_vertical'));
  // Roving tab stop: the checked radio.
  assert.deepEqual([...g.querySelectorAll('ui-radio')].map((r: any) => r.tabIndex), [-1, 0, -1]);
  g.value = 'c';
  await tick();
  assert.deepEqual(checked(g), [false, false, true]);
  g.orientation = 'horizontal';
  await tick();
  assert.ok(g.classList.contains('ui-radio-group__root--orientation_horizontal'));
  assert.equal(g.getAttribute('aria-orientation'), 'horizontal');
  d.remove();
});

test('ui-radio-group: a press or an arrow key changes the group value; the group fires { value, reason, event }, the radios none', async () => {
  const d = await mount(`<ui-radio-group>${RADIOS}</ui-radio-group><ui-radio-group>${RADIOS}</ui-radio-group>`);
  const [g, other] = d.children as any;
  const [a, b, c] = g.querySelectorAll('ui-radio');
  const got: [string, any][] = [], fromRadio: string[] = [];
  for (const t of ['input', 'change']) {
    g.addEventListener(t, (e: CustomEvent) => { if (e.target === g) got.push([t, e.detail]); else fromRadio.push(t); });
  }
  assert.equal(g.value, '');
  assert.equal(a.tabIndex, 0, 'no value: the first radio is the tab stop');
  b.click();
  await tick();
  assert.equal(g.value, 'b');
  assert.deepEqual(got.map(([t, x]) => [t, x.value, x.reason]), [['input', 'b', 'none'], ['change', 'b', 'none']]);
  assert.ok(got[1][1].event instanceof Event);
  assert.deepEqual(fromRadio, [], 'radios in a group fire no events of their own');
  key(b, 'ArrowDown');
  await tick();
  assert.equal(g.value, 'c');
  assert.equal(document.activeElement, c);
  key(c, 'ArrowDown');
  await tick();
  assert.equal(g.value, 'a', 'arrows wrap within the group');
  assert.equal(other.value, '', 'radios without a name do not reach another group');
  assert.deepEqual(checked(other), [false, false, false]);
  d.remove();
});

test('ui-radio-group: disabled and readonly reach the radios; required validates the group', async () => {
  const d = await mount(`<ui-radio-group disabled value="a">${RADIOS}</ui-radio-group>`);
  const g = d.firstElementChild as any;
  const [, b] = g.querySelectorAll('ui-radio');
  assert.equal(b.isDisabled, true);
  assert.equal(b.getAttribute('aria-disabled'), 'true');
  assert.ok(b.hasAttribute('data-disabled') && g.hasAttribute('data-disabled'));
  b.click();
  await tick();
  assert.equal(g.value, 'a', 'a disabled group does not change');
  g.disabled = false;
  await tick();
  assert.equal(b.isDisabled, false);
  assert.ok(!b.hasAttribute('data-disabled'));
  g.readonly = true;
  await tick();
  b.click(); key(b, ' ');
  await tick();
  assert.equal(g.value, 'a', 'read-only keeps the value');
  assert.deepEqual(checked(g), [true, false, false]);
  assert.ok(g.hasAttribute('data-readonly'));
  assert.equal(g.getAttribute('aria-readonly'), 'true');
  d.remove();

  const r = await mount(`<ui-radio-group required>${RADIOS}</ui-radio-group>`);
  const rg = r.firstElementChild as any;
  assert.equal(rg.checkValidity(), false);
  assert.equal(rg.validity.valueMissing, true);
  assert.equal(rg.getAttribute('aria-required'), 'true');
  assert.ok(rg.hasAttribute('data-required'));
  rg.querySelectorAll('ui-radio')[2].click();
  await tick();
  assert.equal(rg.checkValidity(), true);
  r.remove();
});

test('ui-radio-group: one form value; the default is the value attribute, default-value or a radio authored checked; reset returns to it', async () => {
  const d = await mount(`<ui-radio-group name="fruit"><ui-radio value="a">A</ui-radio><ui-radio value="b" checked>B</ui-radio></ui-radio-group>`);
  const g = d.firstElementChild as any;
  assert.equal(g.value, 'b', 'the radio authored checked sets the default');
  assert.equal(g.internals.value, 'b');
  assert.equal(g.querySelector('ui-radio').internals.value ?? null, null, 'the radios submit nothing');
  g.querySelector('ui-radio').click();
  await tick();
  assert.equal(g.internals.value, 'a');
  assert.ok(g.hasAttribute('data-dirty') && g.hasAttribute('data-touched') && g.hasAttribute('data-filled'));
  g.formResetCallback();
  await tick();
  assert.equal(g.value, 'b');
  assert.deepEqual(checked(g), [false, true]);
  d.remove();
  const e = await mount(`<ui-radio-group default-value="a">${RADIOS}</ui-radio-group>`);
  assert.equal((e.firstElementChild as any).value, 'a');
  e.remove();
});

test('ui-radio-group in a ui-field: the field label names the group; a label press focuses the tab stop', async () => {
  const d = await mount(`<ui-field label="Fruit"><ui-radio-group value="b">${RADIOS}</ui-radio-group></ui-field>`);
  const f = d.firstElementChild as any, g = f.querySelector('ui-radio-group');
  await tick();
  const ids = (g.getAttribute('aria-labelledby') ?? '').split(' ');
  assert.equal(document.getElementById(ids[0])?.textContent, 'Fruit');
  f.querySelector('[data-part=label] [data-part=contents]').click();
  assert.equal(document.activeElement, g.querySelectorAll('ui-radio')[1]);
  d.remove();
});

test('React RadioGroup: radiogroup host with the same classes and data-*; native radios share a name; Radio reads the group', () => {
  const out = renderToStaticMarkup(h(RadioGroup, { name: 'fruit', defaultValue: 'b', label: 'Fruit' }, h(Radio, { value: 'a' }, 'A'), h(Radio, { value: 'b' }, 'B')));
  assert.match(out, /^<div role="radiogroup" data-ui="radio-group" aria-label="Fruit"[^>]* class="ui-radio-group__root ui-radio-group__root--orientation_vertical"/);
  assert.equal((out.match(/name="fruit"/g) ?? []).length, 2);
  assert.match(out, /<input type="radio" name="fruit" checked="" value="b"\/>/);
  assert.doesNotMatch(out, /value="a"[^>]*checked/);
  const auto = renderToStaticMarkup(h(RadioGroup, {}, h(Radio, { value: 'a' }, 'A'), h(Radio, { value: 'b' }, 'B')));
  const names = [...auto.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(names.length, 2);
  assert.equal(names[0], names[1], 'a generated name groups the radios');
});

test('state parity: the group host and its radios carry the same data-* in both renderers', async () => {
  const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
  const cases: [string, any][] = [
    [`<ui-radio-group value="b">${RADIOS}</ui-radio-group>`, { defaultValue: 'b' }],
    [`<ui-radio-group disabled required readonly orientation="horizontal">${RADIOS}</ui-radio-group>`, { disabled: true, required: true, readOnly: true, orientation: 'horizontal' }],
  ];
  for (const [markup, props] of cases) {
    const d = await mount(markup);
    const a = d.firstElementChild!;
    const box = document.createElement('div');
    box.innerHTML = renderToStaticMarkup(h(RadioGroup, props, h(Radio, { value: 'a' }, 'Apple'), h(Radio, { value: 'b' }, 'Banana'), h(Radio, { value: 'c' }, 'Cherry')));
    const b = box.firstElementChild!;
    assert.deepEqual(dataNames(a), dataNames(b), `host: ${markup}`);
    for (const n of dataNames(a)) assert.ok(contract.components['ui-radio-group'].host.includes(n), `${n} is listed for ui-radio-group`);
    const ra = [...a.querySelectorAll('ui-radio')], rb = [...b.querySelectorAll('[data-ui=radio]')];
    ra.forEach((r, i) => assert.deepEqual(dataNames(r), dataNames(rb[i]), `radio ${i}: ${markup}`));
    d.remove();
  }
});

test('React RadioGroup: a press calls onValueChange(value, { reason: none, event }); controlled value wins; read-only keeps it', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: [string, any][] = [];
  await act(async () => root.render(h(RadioGroup, { defaultValue: 'a', onValueChange: (v: string, d: any) => calls.push([v, d]) }, h(Radio, { value: 'a' }, 'A'), h(Radio, { value: 'b' }, 'B'))));
  const inputs = box.querySelectorAll('input');
  await act(async () => { inputs[1].click(); });
  assert.deepEqual(calls.map(([v, d]) => [v, d.reason]), [['b', 'none']]);
  assert.ok(calls[0][1].event instanceof Event);
  assert.equal(inputs[1].checked, true);
  assert.ok(box.querySelectorAll('[data-ui=radio]')[1].hasAttribute('data-checked'));
  assert.ok(box.querySelector('[data-ui=radio-group]')!.hasAttribute('data-filled'));
  await act(async () => root.render(h(RadioGroup, { readOnly: true, value: 'a' }, h(Radio, { value: 'a' }, 'A'), h(Radio, { value: 'b' }, 'B'))));
  await act(async () => { box.querySelectorAll('input')[1].click(); });
  assert.equal(box.querySelectorAll('input')[0].checked, true, 'read-only keeps the value');
  await act(async () => root.unmount());
  box.remove();
});
