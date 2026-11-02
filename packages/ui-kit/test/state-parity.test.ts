// The data-* state contract (contracts/states.json): for the same state, the web component (happy-dom)
// and the React renderer (react-dom/server) put the same data-* names on the same host and parts,
// and every state attribute either renderer sets is one the contract defines for that element.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

// happy-dom has no IntersectionObserver (the swiper tracks its slide with one): a no-op stand-in.
(globalThis as any).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };
for (const m of ['button', 'btg', 'choice', 'input', 'select', 'listbox', 'range', 'color', 'swiper']) await import(`../components/${m}/${m}.element.ts`);
const react = async (m: string) => loadTsx(new URL(`../components/${m}/${m}.react.tsx`, import.meta.url));
const { Button } = await react('button');
const { Chip } = await react('btg');
const { Checkbox, Radio, Switch } = await react('choice');
const { Input } = await react('input');
const { Select, SelectOption } = await react('select');
const { Listbox, Segmented, Option } = await react('listbox');
const { Range, Progress } = await react('range');
const { Swatch, Palette } = await react('color');
const { Swiper } = await react('swiper');

const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
/** Structural data-* (anatomy, sizing, variant flags): not state. */
const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size', 'data-icon-size', 'data-hide-label', 'data-selectable', 'data-mark', 'data-dir', 'data-index', 'data-remove', 'data-hover-controls', 'data-no-dots', 'data-no-paddles', 'data-ratio', 'data-fit', 'data-slideshow', 'data-generated']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort();

/** A part of a host: [label, selector]; ':scope' is the host itself. */
type Part = [string, string];
const HOST: Part[] = [['host', ':scope']];

async function wc(markup: string) {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as HTMLElement;
}
function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}

/** Same data-* on host and parts; each name is in the contract for that tag and part. */
async function same(tag: string, markup: string, el: ReactElement, parts: Part[] = HOST, wcParts?: Part[]) {
  const a = await wc(markup), b = ssr(el);
  const allowed = contract.components[tag];
  assert.ok(allowed, `${tag} is in contracts/states.json components`);
  for (const [i, [label, s]] of parts.entries()) {
    const sa = (wcParts ?? parts)[i][1];
    const ea = [...(sa === ':scope' ? [a] : a.querySelectorAll(sa))], eb = [...(s === ':scope' ? [b] : b.querySelectorAll(s))];
    assert.equal(ea.length, eb.length, `${tag} ${label}: same count`);
    ea.forEach((x, k) => {
      assert.deepEqual(names(x), names(eb[k]), `${tag} ${label}[${k}]: web component vs React`);
      for (const n of names(x)) {
        assert.ok(STATE.has(n), `${tag} ${label}: ${n} is defined in the contract`);
        assert.ok((allowed[label] ?? []).includes(n), `${tag} ${label}: ${n} is listed for it`);
      }
    });
  }
  a.parentElement!.remove();
  return names(a);
}

test('button and chip: data-disabled, data-busy, data-pressed', async () => {
  assert.deepEqual(await same('ui-button', '<ui-button disabled>x</ui-button>', h(Button, { disabled: true }, 'x')), ['data-disabled']);
  assert.deepEqual(await same('ui-button', '<ui-button loading>x</ui-button>', h(Button, { loading: true }, 'x')), ['data-busy']);
  assert.deepEqual(await same('ui-chip', '<ui-chip selectable selected>x</ui-chip>', h(Chip, { selectable: true, defaultSelected: true }, 'x')), ['data-pressed']);
  assert.deepEqual(await same('ui-chip', '<ui-chip selectable disabled>x</ui-chip>', h(Chip, { selectable: true, disabled: true }, 'x')), ['data-disabled']);
});

test('checkbox, radio, switch: data-checked / data-unchecked / data-indeterminate and the field state', async () => {
  assert.deepEqual(await same('ui-checkbox', '<ui-checkbox checked>x</ui-checkbox>', h(Checkbox, { defaultChecked: true }, 'x')), ['data-checked', 'data-filled']);
  assert.deepEqual(await same('ui-checkbox', '<ui-checkbox indeterminate>x</ui-checkbox>', h(Checkbox, { indeterminate: true }, 'x')), ['data-indeterminate']);
  assert.deepEqual(await same('ui-checkbox', '<ui-checkbox disabled required>x</ui-checkbox>', h(Checkbox, { disabled: true, required: true }, 'x')), ['data-disabled', 'data-required', 'data-unchecked']);
  assert.deepEqual(await same('ui-radio', '<ui-radio name="p" value="a" checked>x</ui-radio>', h(Radio, { name: 'p', value: 'a', defaultChecked: true }, 'x')), ['data-checked', 'data-filled']);
  assert.deepEqual(await same('ui-switch', '<ui-switch>x</ui-switch>', h(Switch, {}, 'x')), ['data-unchecked']);
  // An author error (React invalid) is data-invalid at once.
  const b = ssr(h(Checkbox, { invalid: true }, 'x'));
  assert.deepEqual(names(b), ['data-invalid', 'data-unchecked']);
});

test('input and select: field state on the host; select trigger, popup and options', async () => {
  assert.deepEqual(await same('ui-input', '<ui-input label="A" value="x" required></ui-input>', h(Input, { label: 'A', defaultValue: 'x', required: true })), ['data-filled', 'data-required']);
  assert.deepEqual(await same('ui-input', '<ui-input label="A" readonly disabled></ui-input>', h(Input, { label: 'A', readOnly: true, disabled: true })), ['data-disabled', 'data-readonly']);
  assert.deepEqual(await same('ui-input', '<ui-input label="A" error="Bad"></ui-input>', h(Input, { label: 'A', error: 'Bad' })), ['data-invalid']);
  const opts = '<ui-option value="a">A</ui-option><ui-option value="b">B</ui-option>';
  const ropts = [h(SelectOption, { key: 'a', value: 'a' }, 'A'), h(SelectOption, { key: 'b', value: 'b' }, 'B')];
  assert.deepEqual(await same('ui-select', `<ui-select label="R" value="b" required>${opts}</ui-select>`, h(Select, { label: 'R', defaultValue: 'b', required: true }, ...ropts)), ['data-filled', 'data-required']);
  assert.deepEqual(await same('ui-select', `<ui-select label="R" value="a" disabled error="Pick">${opts}</ui-select>`, h(Select, { label: 'R', disabled: true, error: 'Pick', defaultValue: 'a' }, ...ropts)), ['data-disabled', 'data-filled', 'data-invalid']);
});

test('ui-select: trigger, popup and options carry the Base UI Select names (web component only: React is a native select)', async () => {
  const el = await wc('<ui-select label="R"><ui-option value="a">A</ui-option><ui-option value="b" disabled>B</ui-option></ui-select>') as any;
  const trigger = el.querySelector('[data-part=trigger]'), popup = el.querySelector('[data-part=popup]');
  assert.deepEqual(names(trigger), ['data-placeholder']);
  assert.deepEqual(names(popup), ['data-closed']);
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await tick();
  assert.deepEqual(names(trigger), ['data-placeholder', 'data-popup-open', 'data-pressed']);
  assert.deepEqual(names(popup), ['data-align', 'data-open', 'data-side']);
  assert.equal(popup.getAttribute('data-side'), 'bottom');
  const [a, b] = el.querySelectorAll('ui-option');
  assert.deepEqual(names(a), ['data-highlighted']);
  assert.deepEqual(names(b), ['data-disabled']);
  for (const n of [...names(trigger), ...names(popup), ...names(a), ...names(b)]) assert.ok(STATE.has(n), n);
  el.parentElement.remove();
});

test('listbox and segmented: host field state and orientation; options data-selected / data-disabled', async () => {
  const OPTS: Part[] = [['host', ':scope'], ['option', '[role=option]']];
  assert.deepEqual(await same('ui-listbox', '<ui-listbox label="L" value="b"><ui-option value="a">A</ui-option><ui-option value="b">B</ui-option><ui-option value="c" disabled>C</ui-option></ui-listbox>',
    h(Listbox, { label: 'L', defaultValue: 'b' }, h(Option, { value: 'a' }, 'A'), h(Option, { value: 'b' }, 'B'), h(Option, { value: 'c', disabled: true }, 'C')), OPTS), ['data-filled', 'data-orientation']);
  assert.deepEqual(await same('ui-segmented', '<ui-segmented label="S" disabled><ui-option value="a">A</ui-option></ui-segmented>',
    h(Segmented, { label: 'S', disabled: true }, h(Option, { value: 'a' }, 'A')), OPTS), ['data-disabled', 'data-orientation']);
});

test('range and progress: orientation, field state; indeterminate / progressing / complete', async () => {
  assert.deepEqual(await same('ui-range', '<ui-range value="30" disabled></ui-range>', h(Range, { defaultValue: 30, disabled: true })), ['data-disabled', 'data-filled', 'data-orientation']);
  assert.deepEqual(await same('ui-progress', '<ui-progress value="40"></ui-progress>', h(Progress, { value: 40 })), ['data-progressing']);
  assert.deepEqual(await same('ui-progress', '<ui-progress value="100"></ui-progress>', h(Progress, { value: 100 })), ['data-complete']);
  assert.deepEqual(await same('ui-progress', '<ui-progress></ui-progress>', h(Progress, {})), ['data-indeterminate']);
});

test('palette and swatch: host field state; swatches data-selected; swatch data-alpha / data-invalid', async () => {
  const SW: Part[] = [['host', ':scope'], ['swatch', '[data-ui=swatch]']];
  assert.deepEqual(await same('ui-palette', '<ui-palette name="c" value="#22aa66"><ui-swatch color="#3366ff"></ui-swatch><ui-swatch color="#22aa66"></ui-swatch></ui-palette>',
    h(Palette, { name: 'c', defaultValue: '#22aa66' }, h(Swatch, { color: '#3366ff' }), h(Swatch, { color: '#22aa66' })), SW, [['host', ':scope'], ['swatch', 'ui-swatch']]), ['data-filled', 'data-orientation']);
  assert.deepEqual(await same('ui-swatch', '<ui-swatch color="rgb(255 0 0 / 40%)"></ui-swatch>', h(Swatch, { color: 'rgb(255 0 0 / 40%)' })), ['data-alpha']);
  // (An unparsable color's data-invalid needs a real CSS parser: happy-dom accepts any color.)
});

test('swiper: the current dot is data-selected, the first paddle data-disabled', async () => {
  const PARTS: Part[] = [['host', ':scope'], ['dot', '[data-part=dot]'], ['paddle', '[data-part=paddle]']];
  await same('ui-swiper', '<ui-swiper label="S"><div>1</div><div>2</div></ui-swiper>', h(Swiper, { label: 'S' }, h('div', null, '1'), h('div', null, '2')), PARTS);
});

test('UIFormElement: blur, typing and focus set data-touched, data-invalid, data-dirty, data-filled, data-focused, data-valid', async () => {
  const el = await wc('<ui-input label="A" required></ui-input>') as any;
  const ed = el.editor as HTMLElement;
  assert.deepEqual(names(el), ['data-required'], 'nothing shown before interaction');
  ed.dispatchEvent(new Event('focusin', { bubbles: true })); await tick();
  assert.ok(el.hasAttribute('data-focused'));
  ed.dispatchEvent(new Event('focusout', { bubbles: true })); await tick();
  assert.deepEqual(names(el), ['data-invalid', 'data-required', 'data-touched']);
  el.value = 'x'; await tick();
  assert.deepEqual(names(el), ['data-dirty', 'data-filled', 'data-required', 'data-touched', 'data-valid']);
  el.value = ''; await tick();
  assert.ok(!el.hasAttribute('data-dirty'), 'back to the initial value: not dirty');
  el.parentElement.remove();
});

test('React hosts: focus, blur, typing and a radio group change update the same data-* (react-dom/client)', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  await act(async () => root.render(h('form', null,
    h(Input, { label: 'A', required: true }),
    h(Radio, { name: 'g', value: 'a', defaultChecked: true }, 'A'), h(Radio, { name: 'g', value: 'b' }, 'B'))));
  const host = box.querySelector('[data-ui=input]')!, input = host.querySelector('input')!;
  assert.deepEqual(names(host), ['data-required']);
  await act(async () => { input.dispatchEvent(new Event('focusin', { bubbles: true })); });
  assert.ok(host.hasAttribute('data-focused'), 'focused');
  await act(async () => { input.dispatchEvent(new Event('focusout', { bubbles: true })); });
  assert.deepEqual(names(host), ['data-invalid', 'data-required', 'data-touched'], 'invalid after blur, like ui-input');
  await act(async () => { input.value = 'x'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.deepEqual(names(host), ['data-dirty', 'data-filled', 'data-required', 'data-touched', 'data-valid']);
  const [ra, rb] = [...box.querySelectorAll('[data-ui=radio]')];
  assert.deepEqual([names(ra), names(rb)], [['data-checked', 'data-filled'], ['data-unchecked']]);
  const ib = rb.querySelector('input')!;
  await act(async () => { ib.click(); });
  assert.ok(ra.hasAttribute('data-unchecked') && rb.hasAttribute('data-checked'), `the group follows: ${names(ra)} / ${names(rb)}`);
  await act(async () => root.unmount());
  box.remove();
});
