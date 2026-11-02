// Disclosure components (collapsible, accordion, tabs): web component behavior in happy-dom, React
// server markup and client behavior, the same data-* state on both renderers (contracts/states.json),
// Base UI event details, and the composed parts against the presets.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

await import('../components/collapsible/collapsible.element.ts');
await import('../components/accordion/accordion.element.ts');
const { Collapsible } = await loadTsx(new URL('../components/collapsible/collapsible.react.tsx', import.meta.url));
const { Accordion } = await loadTsx(new URL('../components/accordion/accordion.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size', 'data-index']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort();
/** Server markup with React's generated ids normalized. */
const html = (el: ReactNode) => renderToStaticMarkup(el as any).replace(/_R_[a-z0-9]+_/gi, 'ID');
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

async function wc<T extends HTMLElement = any>(markup: string): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as T;
}
function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}
type Part = [string, string, string?];
/** Same data-* on host and parts in both renderers; each name is in the contract for that element and part. */
async function same(tag: string, markup: string, el: ReactElement, parts: Part[]) {
  const a = await wc(markup), b = ssr(el);
  const allowed = contract.components[tag];
  assert.ok(allowed, `${tag} is in contracts/states.json components`);
  for (const [label, s, rs] of parts) {
    const ea = [...(s === ':scope' ? [a] : a.querySelectorAll(s))], eb = [...((rs ?? s) === ':scope' ? [b] : b.querySelectorAll(rs ?? s))];
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
}
/** Recipe classes on an element, in order. */
const kit = (el: Element | null) => [...(el?.classList ?? [])].filter((c) => c.startsWith('ui-')).join(' ');

// ── Collapsible ──

test('collapsible: the preset builds a trigger (label, caret) and a panel from the children', async () => {
  const el = await wc('<ui-collapsible label="Recovery keys"><p>Keep them safe.</p></ui-collapsible>');
  const t = el.querySelector(':scope > [data-part=trigger]')!, p = el.querySelector(':scope > [data-part=panel]') as HTMLElement;
  assert.equal(el.children.length, 2);
  assert.equal(t.getAttribute('role'), 'button');
  assert.equal(t.getAttribute('tabindex'), '0');
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  assert.equal(t.getAttribute('aria-controls'), p.id);
  assert.equal(t.querySelector('[data-part=contents]')!.textContent, 'Recovery keys');
  assert.equal(t.querySelector('[data-part=trailing] > i')!.getAttribute('name'), 'caret-down');
  assert.equal(p.querySelector('p')!.textContent, 'Keep them safe.');
  assert.ok(p.hidden, 'closed: the panel is hidden');
  assert.deepEqual(names(el), ['data-closed']);
  assert.deepEqual(names(p), ['data-closed']);
  assert.equal(kit(el), 'ui-collapsible__root');
  assert.equal(kit(t), 'ui-collapsible__trigger');
  assert.equal(kit(p), 'ui-collapsible__panel');
  assert.equal(kit(t.querySelector('[data-part=trailing]')), 'ui-collapsible__trailing');
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement!.remove();
});

test('collapsible: a press, Enter and Space toggle; openchange is cancelable with reason trigger-press', async () => {
  const el = await wc('<ui-collapsible label="A"><p>x</p></ui-collapsible>') as any;
  const t = el.trigger as HTMLElement, got: any[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => got.push(e.detail));
  t.click(); await tick();
  assert.equal(el.open, true);
  assert.ok(el.hasAttribute('open'), 'open reflects');
  assert.equal(t.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(names(t), ['data-panel-open']);
  assert.equal(el.panel.hidden, false);
  assert.deepEqual(Object.keys(got[0]).sort(), ['event', 'open', 'reason']);
  assert.equal(got[0].open, true);
  assert.equal(got[0].reason, 'trigger-press');
  assert.ok(got[0].event instanceof Event);
  key(t, 'Enter'); await tick();
  assert.equal(el.open, false);
  key(t, ' '); await tick();
  assert.equal(el.open, true);
  // preventDefault keeps the panel as it is.
  const stop = (e: Event) => e.preventDefault();
  el.addEventListener('openchange', stop);
  t.click(); await tick();
  assert.equal(el.open, true);
  el.removeEventListener('openchange', stop);
  // Setting open fires nothing.
  const n = got.length;
  el.open = false; await tick();
  assert.equal(got.length, n);
  assert.ok(el.panel.hidden);
  el.parentElement.remove();
});

test('collapsible: default-open, disabled, authored parts and adornments', async () => {
  const d = await wc('<ui-collapsible label="A" default-open><p>x</p></ui-collapsible>') as any;
  assert.equal(d.open, true);
  assert.deepEqual(names(d), ['data-open']);
  d.parentElement.remove();
  const off = await wc('<ui-collapsible label="A" disabled><p>x</p></ui-collapsible>') as any;
  off.trigger.click(); await tick();
  assert.equal(off.open, false, 'disabled ignores presses');
  assert.deepEqual(names(off), ['data-closed', 'data-disabled']);
  assert.equal(off.trigger.getAttribute('aria-disabled'), 'true');
  assert.equal(off.trigger.getAttribute('tabindex'), '-1');
  off.parentElement.remove();
  const parts = await wc('<ui-collapsible><div data-part="trigger" class="mine"><i slot="leading" name="key"></i>Keys<span slot="suffix">3</span></div><div data-part="panel"><p>k</p></div></ui-collapsible>') as any;
  const t = parts.trigger as HTMLElement;
  assert.ok(t.classList.contains('mine'), 'the authored trigger is the trigger');
  assert.deepEqual([...t.children].filter((c) => !(c as HTMLElement).hidden).map((c) => c.getAttribute('data-part')), ['leading', 'contents', 'suffix', 'trailing']);
  assert.equal(t.querySelector('[data-part=contents]')!.textContent, 'Keys');
  assert.equal(parts.panel.querySelector('p').textContent, 'k');
  parts.parentElement.remove();
  // An authored trailing replaces the caret.
  const own = await wc('<ui-collapsible label="A"><div data-part="trigger">A<i slot="trailing" name="plus"></i></div><div data-part="panel">x</div></ui-collapsible>') as any;
  assert.deepEqual([...own.trigger.querySelectorAll('i')].map((i: Element) => i.getAttribute('name')), ['plus']);
  own.parentElement.remove();
});

test('Collapsible (React): the same data-* as ui-collapsible on host, trigger and panel', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', '[data-part=trigger]'], ['panel', '[data-part=panel]']];
  await same('ui-collapsible', '<ui-collapsible label="A"><p>x</p></ui-collapsible>', h(Collapsible, { label: 'A' }, h('p', null, 'x')), P);
  await same('ui-collapsible', '<ui-collapsible label="A" open disabled><p>x</p></ui-collapsible>', h(Collapsible, { label: 'A', defaultOpen: true, disabled: true }, h('p', null, 'x')), P);
});

test('Collapsible (React): native button trigger, recipe classes, the composed parts render the preset', () => {
  const a = html(h(Collapsible, { label: 'Keys', leading: h('i', { name: 'key' }), defaultOpen: true }, h('p', null, 'x')));
  assert.match(a, /^<div data-ui="collapsible" data-open="" class="ui-collapsible__root">/);
  assert.match(a, /<button type="button" data-part="trigger" id="ID\w*" class="ui-collapsible__trigger" aria-expanded="true" aria-controls="ID\w*" data-panel-open="">/);
  assert.match(a, /<span data-part="trailing" class="ui-collapsible__trailing"><i name="caret-down"><\/i><\/span>/);
  assert.match(a, /<div data-part="panel" id="ID\w*" data-open="" class="ui-collapsible__panel"><p>x<\/p><\/div>/);
  const b = html(h(Collapsible.Root, { defaultOpen: true }, h(Collapsible.Trigger, { leading: h('i', { name: 'key' }) }, 'Keys'), h(Collapsible.Panel, null, h('p', null, 'x'))));
  assert.equal(b, a, 'composed = preset');
  const closed = html(h(Collapsible, { label: 'K', trailing: null }, 'x'));
  assert.match(closed, /<div data-part="panel" id="ID\w*" hidden="" data-closed=""/);
  assert.doesNotMatch(closed, /caret-down/, 'trailing={null}: no caret');
  // className function and render receive the state.
  const seen: any[] = [];
  const c = html(h(Collapsible.Root, { defaultOpen: true, className: (s: any) => (s.open ? 'is-open' : 'is-closed') },
    h(Collapsible.Trigger, { render: (props: any, state: any) => { seen.push(state); return h('a', props); } }, 'K'), h(Collapsible.Panel)));
  assert.match(c, /class="ui-collapsible__root is-open"/);
  assert.match(c, /<a type="button" data-part="trigger"/);
  assert.equal(seen[0].panelOpen, true);
  assert.throws(() => html(h(Collapsible.Panel)), /inside Collapsible.Root/);
});

test('Collapsible (React): a press toggles and calls onOpenChange(open, { reason, event }); controlled open stays', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [];
  await act(async () => root.render(h('div', null,
    h(Collapsible, { label: 'A', onOpenChange: (o: boolean, d: any) => calls.push([o, d]) }, 'x'),
    h(Collapsible, { label: 'B', open: false, onOpenChange: (o: boolean, d: any) => calls.push([o, d]) }, 'y'))));
  const [a, b] = [...box.querySelectorAll('[data-ui=collapsible]')];
  await act(async () => { (a.querySelector('button') as HTMLButtonElement).click(); });
  assert.ok(a.hasAttribute('data-open'));
  assert.equal(a.querySelector('[data-part=panel]')!.hasAttribute('hidden'), false);
  assert.equal(calls[0][0], true);
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ['event', 'reason']);
  assert.equal(calls[0][1].reason, 'trigger-press');
  await act(async () => { (b.querySelector('button') as HTMLButtonElement).click(); });
  assert.equal(calls[1][0], true, 'reports the request');
  assert.ok(b.hasAttribute('data-closed'), 'controlled: stays closed');
  await act(async () => root.unmount());
  box.remove();
});

// ── Accordion ──

const ITEMS = '<ui-collapsible value="a" label="A"><p>a</p></ui-collapsible><ui-collapsible value="b" label="B"><p>b</p></ui-collapsible><ui-collapsible value="c" label="C" disabled><p>c</p></ui-collapsible><ui-collapsible value="d" label="D"><p>d</p></ui-collapsible>';
const openOf = (el: any) => el.items.map((i: any) => (i.open ? 1 : 0)).join('');

test('accordion: items get a heading header and a labelled region panel; value and default-value', async () => {
  const el = await wc(`<ui-accordion default-value="b">${ITEMS}</ui-accordion>`) as any;
  assert.equal(el.items.length, 4);
  assert.equal(openOf(el), '0100');
  assert.equal(el.value, 'b');
  const [a] = el.items, h = a.querySelector(':scope > [data-part=header]'), t = h.querySelector(':scope > [data-part=trigger]'), p = a.querySelector(':scope > [data-part=panel]');
  assert.equal(a.getAttribute('data-part'), 'item');
  assert.equal(h.getAttribute('role'), 'heading');
  assert.equal(h.getAttribute('aria-level'), '3');
  assert.equal(p.getAttribute('role'), 'region');
  assert.equal(p.getAttribute('aria-labelledby'), t.id);
  assert.equal(a.getAttribute('data-index'), '0');
  assert.deepEqual(names(el), ['data-orientation']);
  assert.deepEqual(names(p), ['data-closed', 'data-orientation']);
  assert.equal(kit(el), 'ui-accordion__root');
  assert.equal(kit(a), 'ui-collapsible__root ui-accordion__item');
  assert.equal(kit(h), 'ui-accordion__header');
  assert.equal(el.querySelector(NATIVE), null);
  el.value = 'a,d'; await tick();
  assert.equal(openOf(el), '1001', 'value opens the named items');
  el.parentElement.remove();
  // No value: the items' own open attributes seed it (single mode keeps the first).
  const seeded = await wc('<ui-accordion><ui-collapsible label="A" open></ui-collapsible><ui-collapsible label="B" open></ui-collapsible></ui-accordion>') as any;
  assert.equal(seeded.value, '0');
  assert.equal(openOf(seeded), '10');
  seeded.parentElement.remove();
});

test('accordion: single mode closes the others; multiple keeps them; change is cancelable with reason trigger-press', async () => {
  const el = await wc(`<ui-accordion>${ITEMS}</ui-accordion>`) as any;
  const got: any[] = [];
  el.addEventListener('change', (e: CustomEvent) => got.push(e.detail));
  const press = async (i: number) => { el.items[i].trigger.click(); await tick(); };
  await press(0);
  assert.equal(openOf(el), '1000');
  await press(1);
  assert.equal(openOf(el), '0100', 'opening one closes the other');
  assert.deepEqual(got.map((d) => d.value), [['a'], ['b']]);
  assert.deepEqual(Object.keys(got[0]).sort(), ['event', 'reason', 'value']);
  assert.equal(got[0].reason, 'trigger-press');
  await press(1);
  assert.equal(openOf(el), '0000', 'pressing the open one closes it');
  await press(2);
  assert.equal(openOf(el), '0000', 'a disabled item ignores presses');
  const stop = (e: Event) => e.preventDefault();
  el.addEventListener('change', stop);
  await press(3);
  assert.equal(openOf(el), '0000', 'a canceled change keeps every item');
  el.removeEventListener('change', stop);
  el.multiple = true;
  await press(0); await press(3);
  assert.equal(openOf(el), '1001');
  assert.equal(el.value, 'a,d');
  el.disabled = true; await tick();
  await press(0);
  assert.equal(openOf(el), '1001', 'a disabled accordion ignores presses');
  assert.ok(el.items[0].hasAttribute('data-disabled'));
  el.parentElement.remove();
});

test('accordion: arrow keys, Home and End move focus between enabled triggers', async () => {
  const el = await wc(`<ui-accordion>${ITEMS}</ui-accordion>`) as any;
  const t = el.items.map((i: any) => i.trigger as HTMLElement);
  t[0].focus();
  key(t[0], 'ArrowDown');
  assert.equal(document.activeElement, t[1]);
  key(t[1], 'ArrowDown');
  assert.equal(document.activeElement, t[3], 'skips the disabled item');
  key(t[3], 'ArrowDown');
  assert.equal(document.activeElement, t[0], 'wraps');
  key(t[0], 'ArrowUp');
  assert.equal(document.activeElement, t[3]);
  key(t[3], 'Home');
  assert.equal(document.activeElement, t[0]);
  key(t[0], 'End');
  assert.equal(document.activeElement, t[3]);
  assert.equal(openOf(el), '0000', 'focus moves only');
  el.parentElement.remove();
});

const reactItems = () => [
  h(Accordion.Item, { key: 'a', value: 'a', label: 'A' }, h('p', null, 'a')), h(Accordion.Item, { key: 'b', value: 'b', label: 'B' }, h('p', null, 'b')),
  h(Accordion.Item, { key: 'c', value: 'c', label: 'C', disabled: true }, h('p', null, 'c')), h(Accordion.Item, { key: 'd', value: 'd', label: 'D' }, h('p', null, 'd')),
];

test('Accordion (React): the same data-* as ui-accordion on host, items, headers, triggers and panels', async () => {
  const P: Part[] = [['host', ':scope'], ['item', ':scope > [data-part=item]'], ['header', '[data-part=header]'], ['trigger', '[data-part=trigger]'], ['panel', '[data-part=panel]']];
  await same('ui-accordion', `<ui-accordion default-value="b">${ITEMS}</ui-accordion>`, h(Accordion, { defaultValue: ['b'] }, ...reactItems()), P);
  await same('ui-accordion', `<ui-accordion multiple value="a,d" disabled orientation="horizontal">${ITEMS}</ui-accordion>`, h(Accordion, { multiple: true, defaultValue: ['a', 'd'], disabled: true, orientation: 'horizontal' }, ...reactItems()), P);
});

test('Accordion (React): preset items render the composed parts; classes and roles', () => {
  const a = html(h(Accordion, { defaultValue: ['x'] }, h(Accordion.Item, { value: 'x', label: 'Ship', leading: h('i', { name: 'truck' }) }, h('p', null, 'x'))));
  const b = html(h(Accordion.Root, { defaultValue: ['x'] }, h(Accordion.Item, { value: 'x' },
    h(Accordion.Header, null, h(Accordion.Trigger, { leading: h('i', { name: 'truck' }) }, 'Ship')), h(Accordion.Panel, null, h('p', null, 'x')))));
  assert.equal(b, a, 'composed = preset');
  assert.match(a, /^<div data-ui="accordion" data-orientation="vertical" class="ui-accordion__root">/);
  assert.match(a, /<div data-ui="collapsible" data-part="item" data-open="" data-index="0" class="ui-collapsible__root ui-accordion__item">/);
  assert.match(a, /<div data-part="header" role="heading" aria-level="3" data-open="" data-index="0" class="ui-accordion__header"><button type="button" data-part="trigger"/);
  assert.match(a, /<div data-part="panel" id="ID\w*" data-open="" role="region" aria-labelledby="ID\w*trigger" data-orientation="vertical" data-index="0" class="ui-collapsible__panel">/);
  // An item without a value takes its index.
  assert.match(html(h(Accordion, { defaultValue: ['1'] }, h(Accordion.Item, { label: 'A' }, 'a'), h(Accordion.Item, { label: 'B' }, 'b'))), /data-index="0" class="ui-collapsible__root ui-accordion__item">.*data-open="" data-index="1"/);
  assert.throws(() => html(h(Accordion.Item, { label: 'x' })), /inside Accordion.Root/);
});

test('Accordion (React): presses call onValueChange / onOpenChange; single mode; arrow keys move focus', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [], items: any[] = [];
  await act(async () => root.render(h(Accordion, { onValueChange: (v: string[], d: any) => calls.push([v, d]) },
    h(Accordion.Item, { value: 'a', label: 'A', onOpenChange: (o: boolean, d: any) => items.push([o, d.reason]) }, 'a'), h(Accordion.Item, { value: 'b', label: 'B' }, 'b'),
    h(Accordion.Item, { value: 'c', label: 'C', disabled: true }, 'c'))));
  const btn = (i: number) => box.querySelectorAll<HTMLButtonElement>('[data-part=trigger]')[i];
  const open = () => [...box.querySelectorAll('[data-part=item]')].map((i) => (i.hasAttribute('data-open') ? 1 : 0)).join('');
  await act(async () => { btn(0).click(); });
  await act(async () => { btn(1).click(); });
  assert.equal(open(), '010');
  assert.deepEqual(calls.map((c) => c[0]), [['a'], ['b']]);
  assert.equal(calls[0][1].reason, 'trigger-press');
  assert.deepEqual(items, [[true, 'trigger-press']]);
  await act(async () => { btn(2).click(); });
  assert.equal(open(), '010', 'disabled item');
  btn(0).focus();
  await act(async () => { key(btn(0), 'ArrowDown'); });
  assert.equal(document.activeElement, btn(1));
  await act(async () => { key(btn(1), 'ArrowDown'); });
  assert.equal(document.activeElement, btn(0), 'skips the disabled one and wraps');
  await act(async () => root.unmount());
  box.remove();
});
