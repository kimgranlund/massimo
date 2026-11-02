// Event details in Base UI's shape on both renderers (dom/events.ts): web components fire change /
// input / openchange as CustomEvents whose detail is { value | checked | pressed | open, reason, event };
// React renderers call onValueChange / onCheckedChange / onValueCommitted / onSelectedChange with
// (value, { reason, event }). For the same interaction both report the same reason, and the details
// have the same keys. Also Base UI's value / defaultValue (checked / defaultChecked) and the select's
// open / defaultOpen.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { loadTsx } from './load-tsx.ts';

for (const m of ['btg', 'choice', 'input', 'select', 'listbox', 'range', 'color']) await import(`../components/${m}/${m}.element.ts`);
const react = async (m: string) => loadTsx(new URL(`../components/${m}/${m}.react.tsx`, import.meta.url));
const { Chip } = await react('btg');
const { Checkbox } = await react('choice');
const { Input } = await react('input');
const { Select, SelectOption } = await react('select');
const { Listbox, Option } = await react('listbox');
const { Range } = await react('range');
const { Swatch, Palette } = await react('color');

const OPTS = '<ui-option value="a">Apple</ui-option><ui-option value="b">Banana</ui-option><ui-option value="c">Cherry</ui-option>';
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const DETAIL_KEYS = ['event', 'reason'];
/** Set a native control's value past React's value tracker, as typing does. */
const setValue = (el: HTMLInputElement | HTMLSelectElement, v: string) => Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')!.set!.call(el, v);

async function wc<T extends HTMLElement = any>(markup: string): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as T;
}
/** Every CustomEvent of these types on el, as [type, detail]. */
function record(el: Element, types: string[]) {
  const got: [string, any][] = [];
  for (const t of types) el.addEventListener(t, (e) => got.push([t, (e as CustomEvent).detail]));
  return got;
}
/** The details beside the value: Base UI's { reason, event }. */
const details = (d: any, own: string) => { const { [own]: _v, value: _value, ...rest } = d; return rest; };

async function client() {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  return { box, act, render: (el: any) => act(async () => root.render(el)), done: async () => { await act(async () => root.unmount()); box.remove(); } };
}

test('checkbox and chip: change carries { checked | pressed, reason: none, event } on both renderers', async () => {
  const cb = await wc('<ui-checkbox value="yes">A</ui-checkbox>');
  const got = record(cb, ['input', 'change']);
  cb.click(); await tick();
  assert.deepEqual(got.map(([t, d]) => [t, d.checked, d.value, d.reason]), [['input', true, 'yes', 'none'], ['change', true, 'yes', 'none']]);
  assert.ok(got[0][1].event instanceof Event, 'detail.event is the DOM event');
  const chip = await wc('<ui-chip selectable>Tag</ui-chip>');
  const cg = record(chip, ['change']);
  chip.click(); await tick();
  assert.deepEqual([cg[0][1].pressed, cg[0][1].reason], [true, 'none']);

  const r = await client();
  const calls: any[] = [];
  let native = 0;
  await r.render(h('div', null,
    h(Checkbox, { onCheckedChange: (c: boolean, d: any) => calls.push(['checkbox', c, d]), onChange: () => native++ }, 'A'),
    h(Chip, { selectable: true, onSelectedChange: (s: boolean, d: any) => calls.push(['chip', s, d]) }, 'Tag')));
  await r.act(async () => { r.box.querySelector<HTMLInputElement>('[data-ui=checkbox] input')!.click(); });
  await r.act(async () => { r.box.querySelector<HTMLElement>('[data-ui=chip]')!.click(); });
  assert.deepEqual(calls.map(([k, v, d]) => [k, v, d.reason]), [['checkbox', true, 'none'], ['chip', true, 'none']]);
  assert.equal(native, 1, 'native onChange still fires');
  assert.deepEqual(Object.keys(calls[0][2]).sort(), Object.keys(details(got[1][1], 'checked')).sort(), 'same detail keys');
  assert.deepEqual(Object.keys(calls[0][2]).sort(), DETAIL_KEYS);
  await r.done();
});

test('listbox and palette: item-press for a pointer, keyboard for keys, on both renderers', async () => {
  const lb = await wc(`<ui-listbox>${OPTS}</ui-listbox>`);
  const got = record(lb, ['change']);
  lb.options[1].click(); await tick();
  lb.dispatchEvent(new Event('focus')); key(lb, 'ArrowDown'); await tick();
  assert.deepEqual(got.map(([, d]) => [d.value, d.reason]), [['b', 'item-press'], ['c', 'keyboard']]);
  const pal = await wc('<ui-palette selectable><ui-swatch color="#f00"></ui-swatch><ui-swatch color="#0f0"></ui-swatch></ui-palette>');
  const pg = record(pal, ['change']);
  pal.swatches[1].click(); await tick();
  key(pal, 'ArrowLeft'); await tick();
  assert.deepEqual(pg.map(([, d]) => [d.value, d.reason]), [['#0f0', 'item-press'], ['#f00', 'keyboard']]);

  const r = await client();
  const calls: any[] = [];
  await r.render(h('div', null,
    h(Listbox, { onValueChange: (v: string, d: any) => calls.push(['listbox', v, d.reason, Object.keys(d).sort()]) },
      h(Option, { value: 'a' }, 'Apple'), h(Option, { value: 'b' }, 'Banana'), h(Option, { value: 'c' }, 'Cherry')),
    h(Palette, { selectable: true, onValueChange: (v: string, d: any) => calls.push(['palette', v, d.reason, Object.keys(d).sort()]) },
      h(Swatch, { color: '#f00' }), h(Swatch, { color: '#0f0' }))));
  const lbr = r.box.querySelector<HTMLElement>('[data-ui=listbox]')!;
  await r.act(async () => { lbr.querySelectorAll<HTMLElement>('[data-ui=option]')[1].click(); });
  await r.act(async () => { key(lbr, 'ArrowDown'); });
  const radios = r.box.querySelectorAll<HTMLInputElement>('[data-ui=palette] input');
  await r.act(async () => { radios[1].dispatchEvent(new Event('pointerdown', { bubbles: true })); radios[1].click(); });
  await r.act(async () => { radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); radios[0].click(); });
  assert.deepEqual(calls.map((c) => c.slice(0, 3)), [['listbox', 'b', 'item-press'], ['listbox', 'c', 'keyboard'], ['palette', '#0f0', 'item-press'], ['palette', '#f00', 'keyboard']]);
  for (const c of calls) assert.deepEqual(c[3], DETAIL_KEYS);
  await r.done();
});

test('range: input on every change and change on commit with keyboard / track-press / drag; React onValueChange and onValueCommitted', async () => {
  const rg = await wc('<ui-range value="50"></ui-range>');
  const got = record(rg, ['input', 'change']);
  key(rg, 'ArrowRight'); await tick();
  key(rg, 'Home'); key(rg, 'Home'); await tick();
  assert.deepEqual(got.map(([t, d]) => [t, d.value, d.reason]), [['input', 51, 'keyboard'], ['change', 51, 'keyboard'], ['input', 0, 'keyboard'], ['change', 0, 'keyboard']], 'no events without a new value');

  const r = await client();
  const calls: any[] = [];
  await r.render(h(Range, { defaultValue: 50, onValueChange: (v: number, d: any) => calls.push(['value', v, d.reason]), onValueCommitted: (v: number, d: any) => calls.push(['commit', v, d.reason]) }));
  const input = r.box.querySelector<HTMLInputElement>('input')!;
  await r.act(async () => { key(input, 'ArrowRight'); setValue(input, '51'); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); });
  await r.act(async () => {
    input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    setValue(input, '70'); input.dispatchEvent(new Event('input', { bubbles: true }));
    setValue(input, '75'); input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.deepEqual(calls, [['value', 51, 'keyboard'], ['commit', 51, 'keyboard'], ['value', 70, 'track-press'], ['value', 75, 'drag'], ['commit', 75, 'drag']]);
  await r.done();
});

test('input: input while typing and change on blur carry { value, reason: none, event }; React onValueChange', async () => {
  const el = await wc('<ui-input label="Name"></ui-input>');
  const got = record(el, ['input', 'change']);
  const ed = el.editor!;
  ed.dispatchEvent(new Event('focus'));
  ed.textContent = 'Ada'; ed.dispatchEvent(new Event('input', { bubbles: true }));
  ed.dispatchEvent(new Event('blur'));
  await tick();
  assert.deepEqual(got.map(([t, d]) => [t, d.value, d.reason]), [['input', 'Ada', 'none'], ['change', 'Ada', 'none']]);
  assert.equal(got.length, 2, 'the editor\'s native input event stops at the editor');

  const r = await client();
  const calls: any[] = [];
  await r.render(h(Input, { label: 'Name', onValueChange: (v: string, d: any) => calls.push([v, d.reason, Object.keys(d).sort()]) }));
  const input = r.box.querySelector<HTMLInputElement>('input')!;
  await r.act(async () => { setValue(input, 'Ada'); input.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.deepEqual(calls, [['Ada', 'none', DETAIL_KEYS]]);
  await r.done();
});

test('ui-select: openchange { open, reason, event } (cancelable), change with item-press; open / defaultOpen; React onValueChange', async () => {
  const sel = await wc(`<ui-select>${OPTS}</ui-select>`);
  const got = record(sel, ['openchange', 'change']);
  sel.trigger.click(); await tick();
  key(sel.trigger, 'ArrowDown'); await tick();
  key(sel.trigger, 'Enter'); await tick();
  key(sel.trigger, 'ArrowDown'); await tick();
  key(sel.trigger, 'Escape'); await tick();
  assert.deepEqual(got.map(([t, d]) => [t, d.open ?? d.value, d.reason]), [
    ['openchange', true, 'trigger-press'], ['change', 'b', 'item-press'], ['openchange', false, 'item-press'],
    ['openchange', true, 'list-navigation'], ['openchange', false, 'escape-key'],
  ]);
  assert.equal(sel.open, false);
  // preventDefault keeps the popup as it is; the property opens and closes without an event.
  sel.addEventListener('openchange', (e: Event) => e.preventDefault(), { once: true });
  sel.trigger.click(); await tick();
  assert.equal(sel.open, false, 'canceled');
  const n = got.length;
  sel.open = true; await tick();
  assert.equal(sel.trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(sel.trigger.getAttribute('aria-activedescendant'), sel.options[1].id, 'opened on the selected option');
  sel.open = false; await tick();
  assert.equal(got.length, n, 'setting open fires no openchange');

  const d = await wc(`<ui-select default-open default-value="c">${OPTS}</ui-select>`);
  assert.equal(d.open, true, 'default-open');
  assert.equal(d.value, 'c', 'default-value');

  const r = await client();
  const calls: any[] = [];
  let native = 0;
  await r.render(h(Select, { label: 'Fruit', onValueChange: (v: string, dt: any) => calls.push([v, dt.reason, Object.keys(dt).sort()]), onChange: () => native++ },
    h(SelectOption, { value: 'a' }, 'Apple'), h(SelectOption, { value: 'b' }, 'Banana')));
  const s = r.box.querySelector<HTMLSelectElement>('select')!;
  await r.act(async () => { setValue(s, 'b'); s.dispatchEvent(new Event('change', { bubbles: true })); });
  assert.deepEqual(calls, [['b', 'item-press', DETAIL_KEYS]]);
  assert.equal(native, 1);
  await r.done();
});

test('value / defaultValue and checked / defaultChecked: the default sets the first value and the reset value', async () => {
  const form = document.createElement('form');
  form.innerHTML = `<ui-listbox name="l" default-value="b">${OPTS}</ui-listbox><ui-range name="r" default-value="20"></ui-range>`
    + '<ui-checkbox name="c" default-checked>C</ui-checkbox><ui-input name="i" default-value="x"></ui-input>'
    + '<ui-palette name="p" default-value="#0f0"><ui-swatch color="#f00"></ui-swatch><ui-swatch color="#0f0"></ui-swatch></ui-palette>'
    + `<ui-select name="s" value="a" default-value="c">${OPTS}</ui-select>`;
  document.body.append(form);
  await tick(); await tick();
  const [lb, rg, cb, inp, pal, sel] = [...form.children] as any[];
  assert.deepEqual([lb.value, rg.value, cb.checked, inp.value, pal.value, sel.value], ['b', 20, true, 'x', '#0f0', 'a'], 'a value attribute wins over the default');
  lb.value = 'c'; rg.value = 90; cb.checked = false; inp.value = 'y'; pal.value = '#f00';
  for (const el of [lb, rg, cb, inp, pal, sel]) el.formResetCallback(); // happy-dom's form.reset() skips custom elements
  await tick();
  assert.deepEqual([lb.value, rg.value, cb.checked, inp.value, pal.value, sel.value], ['b', 20, true, 'x', '#0f0', 'c'], 'reset returns to the default');
  assert.equal(lb.defaultValue, 'b');
  form.remove();
});
