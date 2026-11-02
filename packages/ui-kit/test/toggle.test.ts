// Toggle (T-0005): web component (pressed state, keys, cancelable change, defaultPressed), React
// renderer (SSR and client), state parity and event details in both.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { loadTsx } from './load-tsx.ts';

await import('../components/toggle/toggle.element.ts');
const { Toggle } = await loadTsx(new URL('../components/toggle/toggle.react.tsx', import.meta.url));
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const STRUCTURE = ['data-ui', 'data-size', 'data-icon-size', 'data-part'];
const dataNames = (el: Element) => [...el.attributes].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.includes(n)).sort();
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d; };
const ssr = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.firstElementChild as HTMLElement; };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

test('ui-toggle: role, aria-pressed, data-pressed; click, Enter and Space flip it; construction pattern', async () => {
  const d = await mount('<ui-toggle><i slot="leading" name="star"></i>Favorite</ui-toggle>');
  const t = d.firstElementChild as any;
  assert.equal(t.getAttribute('role'), 'button');
  assert.equal(t.getAttribute('tabindex'), '0');
  assert.equal(t.getAttribute('aria-pressed'), 'false');
  assert.deepEqual(dataNames(t), []);
  assert.ok(t.querySelector(':scope > [data-part=leading] > i') && t.querySelector(':scope > [data-part=contents]').textContent === 'Favorite');
  assert.ok(t.classList.contains('ui-toggle__root'));
  assert.equal(d.querySelector(NATIVE), null);
  t.click(); await tick();
  assert.equal(t.pressed, true);
  assert.equal(t.getAttribute('aria-pressed'), 'true');
  assert.equal(t.hasAttribute('pressed'), true, 'reflects');
  assert.deepEqual(dataNames(t), ['data-pressed']);
  key(t, 'Enter'); await tick();
  assert.equal(t.pressed, false);
  key(t, ' '); await tick();
  assert.equal(t.pressed, true);
  d.remove();
});

test('ui-toggle: change carries { pressed, reason: none, event } and is cancelable', async () => {
  const d = await mount('<ui-toggle>Bold</ui-toggle>');
  const t = d.firstElementChild as any;
  const got: any[] = [];
  t.addEventListener('change', (e: CustomEvent) => got.push(e.detail));
  t.click(); await tick();
  assert.equal(got[0].pressed, true);
  assert.equal(got[0].reason, 'none');
  assert.ok(got[0].event instanceof Event);
  assert.deepEqual(Object.keys(got[0]).sort(), ['event', 'pressed', 'reason']);
  t.addEventListener('change', (e: Event) => e.preventDefault());
  t.click(); await tick();
  assert.equal(t.pressed, true, 'preventDefault keeps the state');
  assert.equal(got[1].pressed, false);
  d.remove();
});

test('ui-toggle: defaultPressed at connect; disabled blocks activation and leaves the tab order', async () => {
  const d = await mount('<ui-toggle default-pressed>A</ui-toggle><ui-toggle default-pressed pressed="false">B</ui-toggle><ui-toggle disabled>C</ui-toggle>');
  const [a, b, c] = d.querySelectorAll('ui-toggle') as any;
  assert.equal(a.pressed, true);
  assert.equal(b.pressed, false, 'an explicit pressed attribute wins');
  let fired = 0;
  c.addEventListener('change', () => fired++);
  c.click(); key(c, 'Enter'); await tick();
  assert.equal(c.pressed, false);
  assert.equal(fired, 0);
  assert.equal(c.getAttribute('tabindex'), '-1');
  assert.equal(c.getAttribute('aria-disabled'), 'true');
  assert.deepEqual(dataNames(c), ['data-disabled']);
  d.remove();
});

test('React Toggle: a native button with aria-pressed, the same classes and parts', () => {
  const s = renderToStaticMarkup(h(Toggle, { defaultPressed: true, leading: h('i', { name: 'star' }) }, 'Favorite'));
  assert.match(s, /^<button type="button" data-ui="toggle" aria-pressed="true" data-pressed="" class="ui-toggle__root">/);
  assert.match(s, /<span data-part="leading" class="ui-toggle__leading"><i name="star"><\/i><\/span><span data-part="contents" class="ui-toggle__contents">Favorite<\/span>/);
  assert.match(renderToStaticMarkup(h(Toggle, { render: h('div'), className: (st: any) => (st.pressed ? 'on' : 'off') }, 'x')), /^<div type="button" data-ui="toggle" aria-pressed="false" class="ui-toggle__root off">/);
});

test('state parity: data-pressed and data-disabled on both renderers, all in the contract', async () => {
  const cases: [string, any, string[]][] = [
    ['<ui-toggle>x</ui-toggle>', h(Toggle, {}, 'x'), []],
    ['<ui-toggle pressed>x</ui-toggle>', h(Toggle, { pressed: true }, 'x'), ['data-pressed']],
    ['<ui-toggle disabled pressed>x</ui-toggle>', h(Toggle, { disabled: true, defaultPressed: true }, 'x'), ['data-disabled', 'data-pressed']],
  ];
  for (const [markup, el, want] of cases) {
    const d = await mount(markup);
    const a = d.firstElementChild!, b = ssr(el);
    assert.deepEqual(dataNames(a), want, markup);
    assert.deepEqual(dataNames(b), want);
    assert.equal(a.getAttribute('aria-pressed'), b.getAttribute('aria-pressed'));
    for (const n of want) assert.ok(contract.components['ui-toggle'].host.includes(n), n);
    const parts = (e: Element) => [...e.querySelectorAll('[data-part]')].filter((p) => !(p as HTMLElement).hidden).map((p) => `${p.getAttribute('data-part')}:${p.className}`);
    assert.deepEqual(parts(a), parts(b));
    assert.deepEqual([...a.classList].sort(), [...b.classList].sort());
    d.remove();
  }
});

test('React Toggle: onPressedChange(pressed, { reason, event }); uncontrolled flips, controlled stays', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: [boolean, any][] = [];
  await act(async () => root.render(h('div', null,
    h(Toggle, { 'data-k': 'u', onPressedChange: (p: boolean, d: any) => calls.push([p, d]) }, 'U'),
    h(Toggle, { 'data-k': 'c', pressed: false, onPressedChange: (p: boolean, d: any) => calls.push([p, d]) }, 'C'),
    h(Toggle, { 'data-k': 'x', disabled: true, onPressedChange: (p: boolean, d: any) => calls.push([p, d]) }, 'X'))));
  const q = (k: string) => box.querySelector<HTMLElement>(`[data-k=${k}]`)!;
  await act(async () => { q('u').click(); });
  assert.equal(q('u').getAttribute('aria-pressed'), 'true');
  await act(async () => { q('c').click(); });
  assert.equal(q('c').getAttribute('aria-pressed'), 'false', 'controlled: the prop decides');
  await act(async () => { q('x').click(); });
  assert.deepEqual(calls.map(([p, d]) => [p, d.reason, Object.keys(d).sort().join()]), [[true, 'none', 'event,reason'], [true, 'none', 'event,reason']]);
  await act(async () => root.unmount());
  box.remove();
});
